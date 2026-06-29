const gateKey = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncWriteGate')
	: '__orangeOrmSyncWriteGate';

function runSyncWrite(target, options, fn) {
	if (typeof options === 'function') {
		fn = options;
		options = undefined;
	}
	if (!shouldGateWrite(target, options))
		return Promise.resolve().then(fn);
	return getSyncWriteGate(target).runWrite(fn);
}

async function acquireSyncWrite(target, options) {
	if (!shouldGateWrite(target, options))
		return noop;
	return getSyncWriteGate(target).acquireWrite();
}

function runSyncMaintenance(target, fn) {
	if (!resolveGateTarget(target))
		return Promise.resolve().then(fn);
	return getSyncWriteGate(target).runMaintenance(fn);
}

function shouldGateWrite(target, options) {
	if (!resolveGateTarget(target))
		return false;
	if (options && (options.readonly || options.suppressSyncOutbox))
		return false;
	return true;
}

function getSyncWriteGate(target) {
	const gateTarget = resolveGateTarget(target);
	if (!gateTarget)
		return noopGate;
	if (!gateTarget[gateKey])
		gateTarget[gateKey] = createSyncWriteGate();
	return gateTarget[gateKey];
}

function resolveGateTarget(target) {
	if (!target)
		return null;
	const pool = target.poolFactory || target;
	if (pool && pool.__sqliteSync)
		return pool;
	if (target.__sqliteSync)
		return target;
	return null;
}

function createSyncWriteGate() {
	let activeWrites = 0;
	let maintenanceActive = false;
	let pendingMaintenance = 0;
	const writeWaiters = [];
	const maintenanceWaiters = [];

	return {
		acquireWrite,
		runWrite,
		runMaintenance,
		_isIdle
	};

	function acquireWrite() {
		if (canStartWrite()) {
			activeWrites += 1;
			return Promise.resolve(newWriteRelease());
		}
		return new Promise((resolve) => {
			writeWaiters.push(resolve);
		});
	}

	async function runWrite(fn) {
		const release = await acquireWrite();
		try {
			return await fn();
		}
		finally {
			release();
		}
	}

	async function runMaintenance(fn) {
		if (maintenanceActive)
			return fn();
		const release = await acquireMaintenance();
		try {
			return await fn();
		}
		finally {
			release();
		}
	}

	function acquireMaintenance() {
		pendingMaintenance += 1;
		return new Promise((resolve) => {
			maintenanceWaiters.push(() => {
				pendingMaintenance -= 1;
				maintenanceActive = true;
				resolve(releaseMaintenance);
			});
			drain();
		});
	}

	function releaseMaintenance() {
		maintenanceActive = false;
		drain();
	}

	function canStartWrite() {
		return !maintenanceActive && pendingMaintenance === 0;
	}

	function newWriteRelease() {
		let released = false;
		return function releaseWrite() {
			if (released)
				return;
			released = true;
			activeWrites -= 1;
			drain();
		};
	}

	function drain() {
		if (maintenanceActive)
			return;
		if (activeWrites > 0)
			return;
		if (maintenanceWaiters.length > 0) {
			const nextMaintenance = maintenanceWaiters.shift();
			nextMaintenance();
			return;
		}
		while (writeWaiters.length > 0 && canStartWrite()) {
			activeWrites += 1;
			const resolve = writeWaiters.shift();
			resolve(newWriteRelease());
		}
	}

	function _isIdle() {
		return activeWrites === 0
			&& !maintenanceActive
			&& pendingMaintenance === 0
			&& writeWaiters.length === 0
			&& maintenanceWaiters.length === 0;
	}
}

function noop() {}

const noopGate = {
	acquireWrite: () => Promise.resolve(noop),
	runWrite: (fn) => Promise.resolve().then(fn),
	runMaintenance: (fn) => Promise.resolve().then(fn),
	_isIdle: () => true
};

module.exports = {
	acquireSyncWrite,
	getSyncWriteGate,
	runSyncMaintenance,
	runSyncWrite,
	shouldGateWrite
};

const gateKey = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncWriteGate')
	: '__orangeOrmSyncWriteGate';
const {
	acquireCrossTabLock,
	normalizeLockNamePart,
	runWithCrossTabLock
} = require('./crossTabLock');

function runSyncWrite(target, options, fn) {
	if (typeof options === 'function') {
		fn = options;
		options = undefined;
	}
	const gateTarget = resolveGateTarget(target);
	if (isReadonly(options))
		return Promise.resolve().then(fn);
	if (!gateTarget)
		return Promise.resolve().then(fn);
	if (isSuppressSyncOutbox(options))
		return runCrossTabWrite(gateTarget, fn);
	return getSyncWriteGate(gateTarget).runWrite(() => runCrossTabWrite(gateTarget, fn));
}

async function acquireSyncWrite(target, options) {
	const gateTarget = resolveGateTarget(target);
	if (isReadonly(options))
		return noop;
	if (!gateTarget)
		return noop;
	if (isSuppressSyncOutbox(options))
		return acquireCrossTabWrite(gateTarget);
	const releaseWrite = await getSyncWriteGate(gateTarget).acquireWrite();
	let releaseCrossTab = noop;
	try {
		releaseCrossTab = await acquireCrossTabWrite(gateTarget);
	}
	catch (e) {
		releaseWrite();
		throw e;
	}
	return function releaseSyncWrite() {
		releaseCrossTab();
		releaseWrite();
	};
}

function runSyncMaintenance(target, fn) {
	if (!resolveGateTarget(target))
		return Promise.resolve().then(fn);
	return getSyncWriteGate(target).runMaintenance(fn);
}

function shouldGateWrite(target, options) {
	return !!resolveWriteGateTarget(target, options);
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

function resolveWriteGateTarget(target, options) {
	if (isReadonly(options) || isSuppressSyncOutbox(options))
		return null;
	return resolveGateTarget(target);
}

function isReadonly(options) {
	return !!(options && options.readonly);
}

function isSuppressSyncOutbox(options) {
	return !!(options && options.suppressSyncOutbox);
}

function runCrossTabWrite(gateTarget, fn) {
	const lockConfig = getCrossTabWriteLockConfig(gateTarget);
	if (!lockConfig)
		return fn();
	return runWithCrossTabLock(resolveCrossTabWriteLockName(gateTarget, lockConfig), lockConfig, fn);
}

async function acquireCrossTabWrite(gateTarget) {
	const lockConfig = getCrossTabWriteLockConfig(gateTarget);
	if (!lockConfig)
		return noop;
	return acquireCrossTabLock(resolveCrossTabWriteLockName(gateTarget, lockConfig), lockConfig);
}

function getCrossTabWriteLockConfig(gateTarget) {
	const config = gateTarget && gateTarget.__orangeCrossTabWriteLock;
	if (!config || config.enabled === false)
		return null;
	return {
		...config,
		label: config.label || 'sqlite writer lock'
	};
}

function resolveCrossTabWriteLockName(gateTarget, config) {
	if (config && typeof config.name === 'string' && config.name.length > 0)
		return config.name;
	const identity = gateTarget && (
		gateTarget.__orangeSyncLockName
		|| gateTarget.__orangeSyncIdentity
		|| gateTarget.__orangeSqliteOPFSConnectionString
	);
	return `orange-orm:sqlite-write:${normalizeLockNamePart(identity || 'default')}`;
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

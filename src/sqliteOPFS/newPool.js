const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');
const normalizeOpfsSahPoolOptions = require('./normalizeOpfsSahPoolOptions');
const {
	acquireCrossTabLock,
	normalizeLockNamePart
} = require('../sync/crossTabLock');

function newPool(connectionString, poolOptions) {
	poolOptions = normalizePoolOptions(poolOptions);
	let id = newId();
	let client = createSqliteOPFSWorkerClient(connectionString, withOpenOptions(poolOptions));
	let readClient;
	let c = {};
	let ended = false;
	let writerBusy = false;
	const writerQueue = [];
	let nextWriterQueueSeq = 1;
	const singleWorker = shouldUseSingleWorker(poolOptions);
	c.__orangeSqliteOPFSConnectionString = connectionString;
	c.__orangeSqliteOPFSRequestedVfs = poolOptions.vfs;
	c.__orangeCrossTabWriteLock = normalizeCrossTabWriteLockConfig(poolOptions);
	c.__orangeSqliteOPFSReady = client.ready;
	c.__orangeAcquireDatabaseAccess = acquireDatabaseAccess;
	c.__orangeSuspendDatabase = suspendDatabase;
	c.__orangeCloneDatabaseTo = cloneDatabaseTo;

	if (client.ready && typeof client.ready.then === 'function') {
		client.ready.then((result) => {
			c.__orangeSqliteOPFSVfs = result && result.vfs || c.__orangeSqliteOPFSRequestedVfs;
		}).catch(() => {});
	}

	prewarmReadClient();

	c.connect = function(cb, priority) {
		if (ended)
			return cb(new Error('sqliteOPFS pool is closed.'), null, noop);
		writerQueue.push({
			cb,
			priority: normalizePriority(priority),
			seq: nextWriterQueueSeq++
		});
		drainWriterQueue();
	};

	c.connectRead = function(cb, priority) {
		if (singleWorker)
			return c.connect(cb, priority);
		ensureReadClient();
		cb(null, readClient, function(err) {
			if (err && readClient.reset)
				readClient.reset();
		});
	};

	c.end = function() {
		ended = true;
		rejectQueuedWriters();
		const closes = [];
		if (client.close)
			closes.push(client.close());
		if (readClient && readClient.close)
			closes.push(readClient.close());
		delete pools[id];
		return Promise.all(closes).then(() => undefined);
	};

	pools[id] = c;
	return c;

	function prewarmReadClient() {
		if (singleWorker)
			return;
		if (poolOptions && poolOptions.prewarmRead === false)
			return;
		setTimeout(() => {
			try {
				ensureReadClient();
				if (readClient.ready && typeof readClient.ready.catch === 'function')
					readClient.ready.catch(() => {});
			}
			catch (e) {
				// The next readonly query will surface the same worker creation/open error.
			}
		}, 0);
	}

	function ensureReadClient() {
		if (!readClient)
			readClient = createSqliteOPFSWorkerClient(connectionString, withOpenOptions(toReadPoolOptions(poolOptions)));
		return readClient;
	}

	async function acquireDatabaseAccess() {
		const releaseAccessLock = await acquireOPFSAccessLock(poolOptions, connectionString);
		if (poolOptions.vfs !== 'opfs-sahpool' || !client || typeof client.checkout !== 'function')
			return releaseAccessLock;
		let checkoutClient;
		try {
			checkoutClient = await client.checkout(-1);
		}
		catch (error) {
			releaseAccessLock();
			throw error;
		}
		let released = false;
		return async function releaseDatabaseAccess() {
			if (released)
				return;
			released = true;
			try {
				await releaseWorkerCheckout(checkoutClient);
			}
			finally {
				releaseAccessLock();
			}
		};
	}

	function suspendDatabase() {
		const closes = [];
		if (client && typeof client.suspendDatabase === 'function')
			closes.push(client.suspendDatabase());
		else if (client && typeof client.release === 'function')
			closes.push(client.release());
		if (readClient && readClient !== client && typeof readClient.suspendDatabase === 'function')
			closes.push(readClient.suspendDatabase());
		else if (readClient && readClient !== client && typeof readClient.release === 'function')
			closes.push(readClient.release());
		return Promise.all(closes).then(() => undefined);
	}

	function cloneDatabaseTo(targetConnectionString, targetOptions = {}) {
		return new Promise((resolve, reject) => {
			c.connect((error, writer, release) => {
				if (error)
					return reject(error);
				if (!writer || typeof writer.cloneDatabaseTo !== 'function') {
					release();
					return reject(new Error('sqliteOPFS worker cannot clone a database.'));
				}
				let clone;
				try {
					clone = writer.cloneDatabaseTo(targetConnectionString, {
						vfs: targetOptions.vfs,
						opfsSahPoolOptions: normalizeOpfsSahPoolOptions(targetOptions, targetConnectionString)
					});
				}
				catch (cloneError) {
					release(cloneError);
					reject(cloneError);
					return;
				}
				Promise.resolve(clone)
					.then((result) => {
						release();
						resolve(result);
					}, (cloneError) => {
						release(cloneError);
						reject(cloneError);
					});
			}, -1);
		});
	}

	function drainWriterQueue() {
		if (writerBusy || ended)
			return;
		const entry = shiftNextWriter();
		if (!entry)
			return;
		const cb = entry.cb;
		writerBusy = true;
		let released = false;
		let releaseAccessLock = noop;
		acquireOPFSAccessLock(poolOptions, connectionString)
			.then((release) => {
				if (ended) {
					release();
					done();
					return;
				}
				releaseAccessLock = release;
				return checkoutWriterClient(entry.priority)
					.then((checkoutClient) => {
						activeClient = checkoutClient;
						try {
							cb(null, checkoutClient, done);
						}
						catch (e) {
							done(e);
							throw e;
						}
					});
			}, (e) => {
				released = true;
				writerBusy = false;
				cb(e, null, noop);
				drainWriterQueue();
			})
			.catch((e) => {
				if (released)
					return;
				done(e);
				cb(e, null, noop);
			});
		let activeClient = client;

		function done(err) {
			if (released)
				return;
			released = true;
			if (err && client.reset)
				client.reset();
			updatePoolOpenInfo(c, client);
			releaseOPFSAccessHandle(client)
				.then(() => releaseWorkerCheckout(activeClient))
				.then(() => releaseAccessLock())
				.catch(() => releaseAccessLock())
				.then(() => {
					writerBusy = false;
					drainWriterQueue();
				});
		}
	}

	function rejectQueuedWriters() {
		const error = new Error('sqliteOPFS pool is closed.');
		while (writerQueue.length > 0) {
			const entry = writerQueue.shift();
			entry.cb(error, null, noop);
		}
	}

	function shiftNextWriter() {
		if (writerQueue.length <= 1)
			return writerQueue.shift();
		let bestIndex = 0;
		for (let i = 1; i < writerQueue.length; i++) {
			const current = writerQueue[i];
			const best = writerQueue[bestIndex];
			if (current.priority < best.priority || current.priority === best.priority && current.seq < best.seq)
				bestIndex = i;
		}
		return writerQueue.splice(bestIndex, 1)[0];
	}

	function checkoutWriterClient(priority) {
		if (client && typeof client.checkout === 'function')
			return client.checkout(priority);
		return Promise.resolve(client);
	}
}

function noop() {}

function releaseWorkerCheckout(client) {
	if (!client || typeof client.releaseCheckout !== 'function')
		return Promise.resolve();
	return Promise.resolve(client.releaseCheckout()).catch(() => {});
}

function normalizePriority(priority) {
	if (priority === undefined || priority === null)
		return 0;
	const parsed = Number.parseInt(priority, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function withOpenOptions(poolOptions) {
	return shouldUseOPFSAccessLock(poolOptions)
		? { ...poolOptions, deferOpen: true }
		: poolOptions;
}

function toReadPoolOptions(poolOptions) {
	const options = { ...poolOptions, readonly: true };
	if (poolOptions.readWorker) {
		options.worker = poolOptions.readWorker;
		delete options.readWorker;
		return options;
	}
	if (poolOptions.createReadWorker) {
		options.createWorker = poolOptions.createReadWorker;
		delete options.createReadWorker;
		delete options.worker;
		delete options.closeDbOnClose;
		return options;
	}
	if (poolOptions.worker) {
		delete options.worker;
		delete options.closeDbOnClose;
	}
	return options;
}

function acquireOPFSAccessLock(poolOptions, connectionString) {
	if (!shouldUseOPFSAccessLock(poolOptions))
		return Promise.resolve(noop);
	return acquireCrossTabLock(resolveOPFSAccessLockName(connectionString), {
		enabled: true,
		label: 'sqlite OPFS access lock',
		timeoutMs: normalizePositiveInteger(poolOptions.opfsAccessTimeoutMs) || 300000
	});
}

function releaseOPFSAccessHandle(client) {
	if (!client || typeof client.release !== 'function')
		return Promise.resolve();
	const info = typeof client.getOpenInfo === 'function'
		? client.getOpenInfo()
		: null;
	if (!info || info.vfs !== 'opfs-wl')
		return Promise.resolve();
	return client.release();
}

function updatePoolOpenInfo(pool, client) {
	if (!pool || !client || typeof client.getOpenInfo !== 'function')
		return;
	const info = client.getOpenInfo();
	if (!info)
		return;
	pool.__orangeSqliteOPFSVfs = info.vfs || pool.__orangeSqliteOPFSVfs;
}

function shouldUseOPFSAccessLock(poolOptions = {}) {
	return poolOptions.vfs === 'opfs-wl';
}

function resolveOPFSAccessLockName(connectionString) {
	return `orange-orm:sqlite-opfs-access:${normalizeLockNamePart(connectionString || 'default')}:opfs-wl`;
}

function shouldUseSingleWorker(poolOptions = {}) {
	if (poolOptions.singleWorker === true)
		return true;
	const vfs = poolOptions.vfs;
	if (vfs === 'opfs-sahpool' || vfs === 'opfs-wl')
		return true;
	return false;
}

function normalizeCrossTabWriteLockConfig(poolOptions = {}) {
	const defaultEnabled = poolOptions.vfs === 'opfs-wl';
	return {
		enabled: defaultEnabled,
		timeoutMs: normalizePositiveInteger(poolOptions.opfsAccessTimeoutMs) || 300000
	};
}

function normalizePositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePoolOptions(poolOptions) {
	poolOptions = poolOptions || {};
	const vfs = poolOptions.vfs || 'opfs-wl';
	if (vfs !== 'opfs-wl' && vfs !== 'opfs-sahpool')
		throw new Error(`sqliteOPFS vfs "${vfs}" is not supported. Use "opfs-wl" or "opfs-sahpool".`);
	return {
		...poolOptions,
		vfs
	};
}

module.exports = newPool;

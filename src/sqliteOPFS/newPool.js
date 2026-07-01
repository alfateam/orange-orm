const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');

function newPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	let id = newId();
	let client = createSqliteOPFSWorkerClient(connectionString, poolOptions);
	let readClient;
	let c = {};
	let ended = false;
	let writerBusy = false;
	const writerQueue = [];
	const singleWorker = shouldUseSingleWorker(poolOptions);
	c.__orangeSqliteOPFSConnectionString = connectionString;
	c.__orangeSqliteOPFSRequestedVfs = poolOptions.vfs || 'opfs';
	c.__orangeSqliteOPFSFallbackVfs = poolOptions.fallbackVfs;
	c.__orangeCrossTabWriteLock = normalizeCrossTabWriteLockConfig(poolOptions);

	if (client.ready && typeof client.ready.then === 'function') {
		client.ready.then((result) => {
			c.__orangeSqliteOPFSVfs = result && result.vfs || c.__orangeSqliteOPFSRequestedVfs;
			c.__orangeSqliteOPFSFallback = !!(result && result.fallback);
		}).catch(() => {});
	}

	prewarmReadClient();

	c.connect = function(cb) {
		if (ended)
			return cb(new Error('sqliteOPFS pool is closed.'), null, noop);
		writerQueue.push(cb);
		drainWriterQueue();
	};

	c.connectRead = function(cb) {
		if (singleWorker)
			return c.connect(cb);
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
			readClient = createSqliteOPFSWorkerClient(connectionString, { ...poolOptions, readonly: true });
		return readClient;
	}

	function drainWriterQueue() {
		if (writerBusy || ended)
			return;
		const cb = writerQueue.shift();
		if (!cb)
			return;
		writerBusy = true;
		let released = false;
		try {
			cb(null, client, done);
		}
		catch (e) {
			done(e);
			throw e;
		}

		function done(err) {
			if (released)
				return;
			released = true;
			if (err && client.reset)
				client.reset();
			writerBusy = false;
			drainWriterQueue();
		}
	}

	function rejectQueuedWriters() {
		const error = new Error('sqliteOPFS pool is closed.');
		while (writerQueue.length > 0) {
			const cb = writerQueue.shift();
			cb(error, null, noop);
		}
	}
}

function noop() {}

function shouldUseSingleWorker(poolOptions = {}) {
	if (poolOptions.singleWorker === true)
		return true;
	const vfs = poolOptions.vfs || 'opfs';
	if (vfs === 'opfs' || vfs === 'opfs-sahpool' || vfs === 'opfs-wl')
		return poolOptions.singleWorker !== false;
	return false;
}

function normalizeCrossTabWriteLockConfig(poolOptions = {}) {
	const value = poolOptions.crossTabWriteLock;
	if (value === false)
		return { enabled: false };
	const defaultEnabled = poolOptions.vfs === 'opfs-wl' || poolOptions.fallbackVfs === 'opfs-wl';
	if (value === undefined || value === null)
		return { enabled: defaultEnabled };
	if (value === true)
		return { enabled: true };
	if (typeof value === 'string')
		return { enabled: true, name: value };
	if (value !== Object(value))
		throw new Error('Invalid sqliteOPFS crossTabWriteLock configuration');
	return {
		enabled: value.enabled !== false,
		name: typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined,
		timeoutMs: normalizePositiveInteger(value.timeoutMs),
		staleMs: normalizePositiveInteger(value.staleMs),
		pollMs: normalizePositiveInteger(value.pollMs)
	};
}

function normalizePositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

module.exports = newPool;

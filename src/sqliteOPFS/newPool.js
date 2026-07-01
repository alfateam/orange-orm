const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');

function newPool(connectionString, poolOptions) {
	poolOptions = normalizePoolOptions(poolOptions);
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
	c.__orangeSqliteOPFSReady = client.ready;

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
	const defaultEnabled = poolOptions.vfs === 'opfs-wl' || poolOptions.fallbackVfs === 'opfs-wl';
	return {
		enabled: defaultEnabled
	};
}

function normalizePoolOptions(poolOptions) {
	poolOptions = poolOptions || {};
	if (!poolOptions.sync)
		return poolOptions;
	return {
		...poolOptions,
		vfs: poolOptions.vfs || 'opfs-sahpool',
		fallbackVfs: poolOptions.fallbackVfs || 'opfs-wl'
	};
}

module.exports = newPool;

const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');

function newPool(connectionString, poolOptions) {
	let id = newId();
	let client = createSqliteOPFSWorkerClient(connectionString, poolOptions || {});
	let readClient;
	let c = {};
	const singleWorker = shouldUseSingleWorker(poolOptions);

	prewarmReadClient();

	c.connect = function(cb) {
		cb(null, client, function(err) {
			if (err && client.reset)
				client.reset();
		});
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
		if (client.close)
			client.close();
		if (readClient && readClient.close)
			readClient.close();
		delete pools[id];
		return Promise.resolve();
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
}

function shouldUseSingleWorker(poolOptions = {}) {
	if (poolOptions.singleWorker === true)
		return true;
	if (poolOptions.vfs === 'opfs-sahpool')
		return true;
	const vfs = poolOptions.vfs || 'opfs';
	if (vfs === 'opfs' || vfs === 'opfs-wl')
		return poolOptions.singleWorker !== false;
	return false;
}

module.exports = newPool;

const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');

function newPool(connectionString, poolOptions) {
	let id = newId();
	let client = createSqliteOPFSWorkerClient(connectionString, poolOptions || {});
	let readClient;
	let c = {};

	c.connect = function(cb) {
		cb(null, client, function(err) {
			if (err && client.reset)
				client.reset();
		});
	};

	c.connectRead = function(cb) {
		if (!readClient)
			readClient = createSqliteOPFSWorkerClient(connectionString, { ...poolOptions, readonly: true });
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
}

module.exports = newPool;

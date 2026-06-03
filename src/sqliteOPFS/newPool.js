const pools = require('../pools');
const newId = require('../newId');
const createSqliteOPFSWorkerClient = require('./workerClient');

function newPool(connectionString, poolOptions) {
	let id = newId();
	let client = createSqliteOPFSWorkerClient(connectionString, poolOptions || {});
	let c = {};

	c.connect = function(cb) {
		cb(null, client, function(err) {
			if (err && client.reset)
				client.reset();
		});
	};

	c.end = function() {
		if (client.close)
			client.close();
		delete pools[id];
		return Promise.resolve();
	};

	pools[id] = c;
	return c;
}

module.exports = newPool;

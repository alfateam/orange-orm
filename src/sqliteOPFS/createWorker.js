const createSqliteOPFSWorkerClient = require('./workerClient');

function createSqliteOPFSWorker(options = {}) {
	return createSqliteOPFSWorkerClient.createWorker(options.connectionString || 'orange.sqlite3', options);
}

module.exports = createSqliteOPFSWorker;

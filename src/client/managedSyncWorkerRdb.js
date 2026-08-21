const client = require('./index');
const map = require('./map');
const createSyncWorkerHandler = require('./syncWorkerHandler');
const newSqliteOPFSDatabase = require('../sqliteOPFS/newDatabase');

function managedSyncWorkerRdb() {
	return client.apply(null, arguments);
}

managedSyncWorkerRdb.map = map.bind(null, managedSyncWorkerRdb);
managedSyncWorkerRdb.sqliteOPFS = newSqliteOPFSDatabase;
managedSyncWorkerRdb.createSyncWorkerHandler = createSyncWorkerHandler;

module.exports = managedSyncWorkerRdb;

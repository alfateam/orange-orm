const { appendRoleSuffix } = require('../sqliteOPFS/storageLayout');
const { databaseName, assertDatabasesClosed } = require('./newPool');

// Public storage operation: callers supply only their logical connection string.
// All clients for this database must have completed close() before deletion.
async function deleteSqliteNative(connectionString, options = {}) {
	const plugin = options.capacitorSQLite;
	if (!plugin)
		throw new Error('deleteSqliteNative requires options.capacitorSQLite.');
	const connections = [connectionString];
	if (options.sync)
		connections.push(appendRoleSuffix(connectionString, 'b'), appendRoleSuffix(connectionString, 'delta'));
	// Validate every target before mutating storage, including unopened pools.
	const names = connections.map(databaseName);
	assertDatabasesClosed(plugin, names);
	for (const database of names) {
		const args = { database, readonly: false };
		await plugin.createConnection({ ...args, version: 1, encrypted: false, mode: 'no-encryption' });
		try {
			await plugin.open(args);
			// The plugin owns native paths and SQLite sidecar cleanup.
			await plugin.deleteDatabase(args);
		}
		finally {
			await plugin.closeConnection(args);
		}
	}
}

module.exports = deleteSqliteNative;

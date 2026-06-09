const log = require('../table/log');
const connectionCache  = new WeakMap();

function wrapCommand(_context, connection) {
	let statementCache = connectionCache.get(connection);
	if (!statementCache) {
		statementCache = new Map();
		connectionCache.set(connection, statementCache);
	}

	return runCommand;

	function runCommand(query, onCompleted) {
		try {
			var params = query.parameters;
			var sql = query.sql();
			var completeQuery = log.startQuery({ sql, parameters: params });

			let statement = statementCache.get(sql);
			if (!statement) {
				statement = connection.prepare(sql);
				statementCache.set(sql, statement);
			}
			const info = statement.run.apply(statement, params);
			completeQuery();
			onCompleted(null, { rowsAffected: info.changes, lastInsertRowid: info.lastInsertRowid });
		}
		catch (e) {
			if (completeQuery)
				completeQuery(e);
			onCompleted(e);
		}
	}

}

module.exports = wrapCommand;

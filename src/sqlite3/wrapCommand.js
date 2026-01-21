var log = require('../table/log');
var connectionCache = new WeakMap();

function wrapCommand(_context, connection) {
	var statementCache = connectionCache.get(connection);
	if (!statementCache) {
		statementCache = new Map();
		connectionCache.set(connection, statementCache);
	}
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });

		try {
			var statement = statementCache.get(sql);
			if (!statement) {
				statement = connection.prepare(sql);
				statementCache.set(sql, statement);
			}
			var info = statement.run.apply(statement, params);
			var affected = info && typeof info.changes === 'number' ? info.changes : 0;
			var insertId = info && typeof info.lastInsertRowid !== 'undefined' ? info.lastInsertRowid : undefined;
			if (typeof insertId !== 'undefined')
				onCompleted(null, { rowsAffected: affected, lastInsertRowid: insertId });
			else
				onCompleted(null, { rowsAffected: affected });
		}
		catch (e) {
			onCompleted(e);
		}
	}
}

module.exports = wrapCommand;

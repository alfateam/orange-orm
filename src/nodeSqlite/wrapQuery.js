const log = require('../table/log');
const connectionCache  = new WeakMap();

function wrapQuery(_context, connection) {
	let statementCache = connectionCache.get(connection);
	if (!statementCache) {
		statementCache = new Map();
		connectionCache.set(connection, statementCache);
	}

	return runQuery;

	function runQuery(query, onCompleted) {
		try {
			var params = query.parameters;
			var sql = query.sql();
			var completeQuery = log.startQuery({ sql, parameters: params });

			let statement = statementCache.get(sql);
			if (!statement) {
				statement = connection.prepare(sql);
				statementCache.set(sql, statement);
			}
			const rows = statement.all.apply(statement, params);
			completeQuery();
			onCompleted(null, rows);
		}
		catch (e) {
			if (completeQuery)
				completeQuery(e);
			onCompleted(e);
		}
	}

}

module.exports = wrapQuery;

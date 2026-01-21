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
			log.emitQuery({ sql, parameters: params });

			let statement = statementCache.get(sql);
			if (!statement) {
				statement = connection.prepare(sql);
				statementCache.set(sql, statement);
			}

			if (statement.reader) {
				const rows = statement.all.apply(statement, params);
				onCompleted(null, rows);
			} else {
				statement.run.apply(statement, params);
				onCompleted(null, []);
			}
		}
		catch (e) {
			onCompleted(e);
		}
	}
}

module.exports = wrapQuery;

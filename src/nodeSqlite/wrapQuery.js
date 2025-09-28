var log = require('../table/log');

function wrapQuery(_context, connection) {
	const statementCache = new Map();
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
			const rows = statement.all.apply(statement, params);
			onCompleted(null, rows);
		}
		catch (e) {
			onCompleted(e);
		}
	}

}

module.exports = wrapQuery;
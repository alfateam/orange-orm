var log = require('../table/log');

function wrapQuery(_context, connection) {
	return runQuery;

	function runQuery(query, onCompleted) {
		try {
			var params = query.parameters;
			var sql = query.sql();
			log.emitQuery({ sql, parameters: params });

			var statement = connection.query(sql);
			const rows = statement.all.apply(statement, params);
			onCompleted(null, rows);
		}
		catch (e) {
			onCompleted(e);
		}
	}

}

module.exports = wrapQuery;
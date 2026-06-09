var log = require('../table/log');

function wrapQuery(_context, connection) {
	return runQuery;

	function runQuery(query, onCompleted) {
		try {
			var params = query.parameters;
			var sql = query.sql();
			var completeQuery = log.startQuery({ sql, parameters: params });

			var statement = connection.query(sql);
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

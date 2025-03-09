var log = require('../table/log');

function wrapQuery(connection) {
	var runOriginalQuery = connection.all;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({sql, parameters: params});

		runOriginalQuery.call(connection, sql, params, onInnerCompleted);

		function onInnerCompleted(err, rows) {
			if (err)
				onCompleted(err);
			else
				onCompleted(null, rows);
		}
	}

}

module.exports = wrapQuery;
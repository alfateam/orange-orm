var log = require('../table/log');

function wrapQuery(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		var completeQuery = log.startQuery({sql, parameters: params});
		return runOriginalQuery.call(connection, sql, params, function(err, result) {
			completeQuery(err);
			onCompleted(err, result);
		});
	}

}

module.exports = wrapQuery;

var log = require('../table/log');

function wrapQuery(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({sql, parameters: params});
		return runOriginalQuery.call(connection, sql, params, onCompleted);
	}

}

module.exports = wrapQuery;
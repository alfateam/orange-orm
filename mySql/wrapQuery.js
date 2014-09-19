function wrapQuery(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters.toArray();
		var sql = query.sql();
		runOriginalQuery.call(connection, sql, params, onCompleted);
	}

}

module.exports = wrapQuery;
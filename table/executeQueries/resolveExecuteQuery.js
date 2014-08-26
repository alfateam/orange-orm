function resolveExecuteQuery(query) {
	var params = query.parameters.toArray();
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
	
		client.query(replaceParamChar(), params, onCompleted);


		function onCompleted(err,result) {
			if(!err) {
				result.queryContext = query.queryContext;
				success(result.rows);
			}
			else
				failed(err);
		}		
	}

	function replaceParamChar() {
		if (params.length == 0)
			return query.sql();
		var splitted = query.sql().split('$');
		var sql = '';
		var lastIndex = splitted.length-1;
		for (var i = 0; i < lastIndex; i++) {
			sql += splitted[i] + '$' + (i+1);
		};
		sql += splitted[lastIndex];
		return sql;
	}

}

module.exports = resolveExecuteQuery;

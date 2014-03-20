function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
	
		client.query(replaceParamChar(query.sql()), query.parameters.toArray(), onCompleted);

		function replaceParamChar(initial) {
			var splitted = initial.split('$');
			var sql = '';
			for (var i = 0; i < splitted.length-1; i++) {
				sql += splitted[i] + '$' + (i+1);
			};
			return sql;
		}

		function onCompleted(err,result) {
			if(!err)
				success(result.rows);
			else
				failed(err);
		}		
	}
}

module.exports = resolveExecuteQuery;

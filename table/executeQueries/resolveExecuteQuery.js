function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
		client.query(query.sql(), query.parameters().toArray(), onCompleted);
		
		function onCompleted(err,result) {
			if(!err)
				success(result.rows);
			else
				failed(err);
		}		
	}
}

module.exports = resolveExecuteQuery;

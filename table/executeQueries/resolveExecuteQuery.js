function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
	
		client.query(query, onCompleted);

		function onCompleted(err,rows) {
			if(!err) {
				rows.queryContext = query.queryContext;				
				success(rows);
			}
			else
				failed(err);
		}		
	}

}

module.exports = resolveExecuteQuery;

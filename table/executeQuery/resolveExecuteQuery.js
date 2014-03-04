function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
		client.query(query,onCompleted);
		
		function onCompleted(err,result) {
			if(!err)
				success(result);
			else
				failed(err);
		}		
	}
}

module.exports = resolveExecuteQuery;

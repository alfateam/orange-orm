function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = process.domain.dbClient;
		client.query(query,onCompleted);
		
		function onCompleted(err,result) {
			console.log(err);
			console.log(result);
			success(result);
		}		
	}
}

module.exports = resolveExecuteQuery;

var getSessionSingleton = require('../getSessionSingleton');

function resolveExecuteQuery(query) {
	return resolve;
	
	function resolve(success,failed) {
		var client = getSessionSingleton('dbClient');
	
		client.executeQuery(query, onCompleted);

		function onCompleted(err,rows) {
			if(!err) {
				Object.defineProperty(rows, 'queryContext', {
					value: query.queryContext,
					enumerable: false
				});
				success(rows);
			}
			else
				failed(err);
		}		
	}

}

module.exports = resolveExecuteQuery;

var log = require('../log');
var getSessionSingleton = require('../getSessionSingleton');

function resolveExecuteQuery(query) {
	log(query);
	return resolve;
	
	function resolve(success,failed) {
		var client = getSessionSingleton('dbClient');
	
		client.executeQuery(query, onCompleted);

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

const getSessionSingleton = require('../getSessionSingleton');
const negotiateNullParams = require('./negotiateNullParams');

function resolveExecuteQuery(context, query) {
	return resolve;

	function resolve(success, failed) {
		try {
			var client = getSessionSingleton(context, 'dbClient');
			query = negotiateNullParams(query);
			client.executeCommand(query, onCompleted);
		} catch (e) {
			failed(e);
		}

		function onCompleted(err, rows) {
			if (!err)
				success(rows);
			else
				failed(err);
		}
	}

}



module.exports = resolveExecuteQuery;
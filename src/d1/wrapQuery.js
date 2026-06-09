var log = require('../table/log');

function wrapQuery(_context, client) {

	return runQuery;

	function runQuery(query, onCompleted) {

		var params = query.parameters;
		var sql = query.sql();
		var completeQuery = log.startQuery({sql, parameters: params});
		client.d1.prepare(sql, params).bind(...params).all().then(onInnerCompleted, onError);

		function onInnerCompleted(response) {
			completeQuery();
			onCompleted(null, response.results);
		}

		function onError(e) {
			completeQuery(e);
			onCompleted(e);
		}

	}

}

module.exports = wrapQuery;

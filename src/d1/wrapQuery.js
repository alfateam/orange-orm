var log = require('../table/log');

function wrapQuery(_context, client) {

	return runQuery;

	function runQuery(query, onCompleted) {

		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({sql, parameters: params});
		client.d1.prepare(sql, params).bind(...params).all().then(onInnerCompleted, onCompleted);

		function onInnerCompleted(response) {
			onCompleted(null, response.results);
		}

	}

}

module.exports = wrapQuery;
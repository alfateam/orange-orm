var log = require('../table/log');
var replaceParamChar = require('./replaceParamChar');

function wrapQuery(connection) {
	var runOriginalQuery = connection.execute;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		console.dir(sql);
		log.emitQuery({sql, parameters: params});

		runOriginalQuery.call(connection, sql, params, onInnerCompleted);

		function onInnerCompleted(err, rows) {
			if (err)
				onCompleted(err);
			else
				onCompleted(null, rows);
		}
	}

}

module.exports = wrapQuery;
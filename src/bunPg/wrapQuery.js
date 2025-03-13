var log = require('../table/log');
var replaceParamChar = require('../pg/replaceParamChar');

function wrapQuery(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		query = {
			text: sql,
			values: params,
			types: query.types
		};
		log.emitQuery({sql, parameters: params});

		runOriginalQuery.call(connection, query, onInnerCompleted);

		function onInnerCompleted(err, result) {
			if (err)
				onCompleted(err);
			else {
				if (Array.isArray(result))
					result = result[result.length-1];
				onCompleted(null, result.rows);
			}
		}
	}

}

module.exports = wrapQuery;
var log = require('../table/log');
var replaceParamChar = require('../pg/replaceParamChar');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		var completeQuery = log.startQuery({ sql, parameters: params });

		runOriginalQuery
			.call(connection, sql, params)
			.then(
				(result) => onInnerCompleted(null, result),
				(e) => onInnerCompleted(e)
			);

		function onInnerCompleted(err, result) {
			completeQuery(err);
			if (err) return onCompleted(err);

			if (Array.isArray(result)) result = result[result.length - 1];

			onCompleted(null, { rowsAffected: result.affectedRows });
		}
	}
}

module.exports = wrapCommand;

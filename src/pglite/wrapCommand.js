var log = require('../table/log');
var replaceParamChar = require('../pg/replaceParamChar');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		log.emitQuery({ sql, parameters: params });

		runOriginalQuery
			.call(connection, sql, params)
			.then(
				(result) => onInnerCompleted(null, result),
				(e) => onInnerCompleted(e)
			);

		function onInnerCompleted(err, result) {
			if (err) return onCompleted(err);

			if (Array.isArray(result)) result = result[result.length - 1];

			var affectedRows =
				result && typeof result.rowCount === 'number' ? result.rowCount : 0;

			return onCompleted(null, { affectedRows });
		}
	}
}

module.exports = wrapCommand;

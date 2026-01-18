var log = require('../table/log');
var replaceParamChar = require('./replaceParamChar');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.query;
	return runCommand;

	function runCommand(query, onCompleted) {
		var params = query.parameters;
		log.emitQuery({sql: query.sql(), parameters: params});
		var sql = replaceParamChar(query, params);
		query = {
			text: sql,
			values: params,
			types: query.types
		};

		runOriginalQuery.call(connection, query, onInnerCompleted);

		function onInnerCompleted(err, result) {
			if (err)
				onCompleted(err);
			else
				onCompleted(null, { rowsAffected: result.rowCount });

		}
	}

}

module.exports = wrapCommand;
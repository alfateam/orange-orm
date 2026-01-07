var log = require('../table/log');
var replaceParamChar = require('./replaceParamChar');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.execute;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		log.emitQuery({ sql: query.sql(), parameters: params });

		var sql = replaceParamChar(query, params);

		runOriginalQuery.call(
			connection,
			sql,
			params,
			{
				fetchTypeHandler: function(metaData) {
					metaData.name = metaData.name.toLowerCase();
				},
			},
			onInnerCompleted
		);

		function onInnerCompleted(err, result) {
			if (err) return onCompleted(err);

			var affectedRows =
        typeof result.rowsAffected === 'number' ? result.rowsAffected : 0;

			return onCompleted(null, { affectedRows });
		}
	}
}

module.exports = wrapCommand;

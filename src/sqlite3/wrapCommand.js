var log = require('../table/log');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.run;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });

		runOriginalQuery.call(connection, sql, params, function onInnerCompleted(err) {
			if (err) {
				onCompleted(err);
			} else {
				var affectedRows = typeof this.changes === 'number' ? this.changes : 0;
				onCompleted(null, { rowsAffected: affectedRows });
			}
		});
	}
}

module.exports = wrapCommand;

var log = require('../table/log');

function wrapCommand(_context, connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({sql, parameters: params});
		return runOriginalQuery.call(connection, sql, params, _onCompleted);

		function _onCompleted(e, _result) {
			const result = {rowsAffected: _result?.affectedRows, ..._result};
			onCompleted(e, result);

		}
	}

}

module.exports = wrapCommand;
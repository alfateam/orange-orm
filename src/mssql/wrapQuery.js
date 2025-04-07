var log = require('../table/log');

function wrapQuery(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = query.sql();
		log.emitQuery({ sql, parameters: params });
		const sap = connection.msnodesqlv8;
		for (let i = 0; i < params.length; i++) {
			const parameter = params[i];
			if (typeof parameter === 'string')
				params[i] = sap.VarChar(parameter);
		}

		runOriginalQuery.call(connection, sql, params, onInnerCompleted);
		let result = [];

		function onInnerCompleted(err, rows, hasMore) {
			if (err) {
				if (err.code)
					onCompleted(err);
				return;
			}
			result.push(rows);
			if (!hasMore) {

				if (result.length === 1)
					onCompleted(null, result[0]);
				else
					onCompleted(null, result);
			}
		}
	}

}

module.exports = wrapQuery;
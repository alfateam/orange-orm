var log = require('../table/log');
var replaceParamChar = require('./replaceParamChar');

function wrapQuery(connection) {
	var runOriginalQuery = connection.execute;
	return runQuery;

	function runQuery(query, onCompleted) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		log.emitQuery({ sql, parameters: params });




		runOriginalQuery.call(connection, sql, params, {
			fetchTypeHandler: function(metaData) {
				// Tells the database to return column names in lowercase
				metaData.name = metaData.name.toLowerCase();
			}
		}, onInnerCompleted);

		function onInnerCompleted(err, rows) {
			if (err)
				onCompleted(err);
			else {
				if (rows.rows)
					rows = rows.rows;
				else
					rows = [rows];
				onCompleted(null, rows);
			}
		}
	}

}

module.exports = wrapQuery;
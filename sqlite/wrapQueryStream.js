var log = require('../table/log');
var newStreamableQuery = require('./newStreamableQuery');

function wrapQueryStream(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, options) {
		var params = query.parameters;
		var sql = query.sql();
		log(sql);
		log('parameters: ' + params);
		query = newStreamableQuery(sql, params, options);

		return runOriginalQuery.call(connection, query);
	}

}

module.exports = wrapQueryStream;
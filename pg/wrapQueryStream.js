var log = require('../table/log');
var replaceParamChar = require('./replaceParamChar');
var newStreamableQuery = require('./newStreamableQuery');

function wrapQueryStream(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query) {
		var params = query.parameters;
		var sql = replaceParamChar(query, params);
		log(sql);
		log('parameters: ' + params);
		query = newStreamableQuery(sql, params);

		return runOriginalQuery.call(connection, query);
	}

}

module.exports = wrapQueryStream;
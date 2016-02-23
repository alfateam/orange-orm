var negotiateSql = require('./negotiateSql');
var negotiateParameters = require('./negotiateParameters');

function wrapQuery(query) {
	var safeSql = negotiateSql(query);
	var safeParameters = negotiateParameters(query.parameters);
	return {
		sql: safeSql,
		parameters: safeParameters
	};
}

module.exports = wrapQuery;
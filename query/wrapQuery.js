var negotiateSql = require('./negotiateSql');
var negotiateParameters = require('./negotiateParameters');

function wrapQuery(query) {
	var safeSql = negotiateSql(query);
	var safeParameters = negotiateParameters(query.parameters);
	let obj =  {
		sql: safeSql,
		parameters: safeParameters
	};
	if (query.types)
		obj.types = query.types;
	return obj;
}


module.exports = wrapQuery;
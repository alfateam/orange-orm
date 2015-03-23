var newQuery = require('./newQuery');
var executeQueries = require('./executeQueries');
var resultToRows = require('./resultToRows');
var strategyToSpan = require('./strategyToSpan');
var emptyInnerJoin = require('./query/newParameterized')();
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var alias = '_0';

function getMany(table,filter,strategy) {		
	filter = negotiateRawSqlFilter(filter);
	var span = strategyToSpan(table,strategy);
	var queries = newQuery([],table,filter,span,alias,emptyInnerJoin);
	return executeQueries(queries).then(onResult);
	
	function onResult(result) {
		return resultToRows(span,result);
	}
}

module.exports = getMany;
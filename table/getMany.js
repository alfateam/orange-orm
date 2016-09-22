var newQuery = require('./newQuery');
var executeQueries = require('./executeQueries');
var resultToRows = require('./resultToRows');
var strategyToSpan = require('./strategyToSpan');
var emptyInnerJoin = require('./query/newParameterized')();
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');

function getMany(table,filter,strategy) {
	return getManyCore(table,filter,strategy);
}

function getManyCore(table,filter,strategy,exclusive) {
	var alias = table._dbName;
	var noOrderBy;
	filter = negotiateRawSqlFilter(filter);
	var span = strategyToSpan(table,strategy);
	var queries = newQuery([],table,filter,span,alias,emptyInnerJoin,noOrderBy,exclusive);
	return executeQueries(queries).then(onResult);
	
	function onResult(result) {
		return resultToRows(span,result);
	}
}

getMany.exclusive = function(table,filter,strategy) {
	return getManyCore(table,filter,strategy,true);
};

module.exports = getMany;
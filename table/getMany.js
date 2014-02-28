var newQuery = require('./newQuery');
var executeQuery = require('./executeQuery');
var resultToRows = require('./resultToRows');
var strategyToSpan = require('./strategyToSpan');
var emptyInnerJoin = require('./query/newParameterized')();
var alias = '_0';

function getMany(table,filter,strategy) {
	var span = strategyToSpan(table,strategy);
	var query = newQuery(table,filter,span,alias,emptyInnerJoin);
	var result = executeQuery(query);
	return resultToRows(table,span,result);
	//todo promise
}

module.exports = getMany;
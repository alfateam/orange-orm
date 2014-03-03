var newQuery = require('./newQuery');
var executeQuery = require('./executeQuery');
var resultToRows = require('./resultToRows');
var strategyToSpan = require('./strategyToSpan');
var emptyInnerJoin = require('./query/newParameterized')();
var alias = '_0';

function getMany(table,filter,strategy) {	
	var span = strategyToSpan(table,strategy);
	var query = newQuery(table,filter,span,alias,emptyInnerJoin);
	return executeQuery(query).then(onResult);
	
	function onResult(result) {
		return resultToRows(table,span,result);
	}
}

module.exports = getMany;
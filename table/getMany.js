var newQuery = require('./newQuery');
var executeQuery = require('./executeQuery');
var resultToRows = require('./resultToRows');
var strategyToSpan = require('./strategyToSpan');
var alias = '_0';

function getMany(table,filter,strategy) {
	var span = strategyToSpan(strategy);
	var query = newQuery(table,filter,span,alias);
	var result = executeQuery(query);
	return resultToRows(table,span,result);
}

module.exports = getMany;
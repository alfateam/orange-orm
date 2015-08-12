var newSelectQuery = require('./readStream/newQuery');
var executeQueries = require('./readStream/executeQuery');
var resultToRows = require('./readStream/resultToRows');
var strategyToSpan = require('./strategyToSpan');
var emptyInnerJoin = require('./query/newParameterized');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');


function createReadStream(table,filter,strategy) {
	var alias = table._dbName;
	filter = negotiateRawSqlFilter(filter);
	var span = strategyToSpan(table,strategy);
	var queries = newQuery([],table,filter,span,alias,emptyInnerJoin);
	return executeQueries(queries).then(onResult);
	
	function onResult(result) {
		return resultToRows(span,result);
	}
}

module.exports = getMany;
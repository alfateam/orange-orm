let newQuery = require('./newQuery');
let executeQueries = require('./executeQueries');
let resultToRows = require('./resultToRows');
let strategyToSpan = require('./strategyToSpan');
let emptyInnerJoin = require('./query/newParameterized')();
let negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');

function getMany(context,table,filter,strategy) {
	return getManyCore(context, table,filter,strategy);
}

async function getManyCore(context,table,filter,strategy,exclusive) {
	let alias = table._dbName;
	let noOrderBy;
	filter = negotiateRawSqlFilter(context, filter, table);
	let span = strategyToSpan(table,strategy);
	let queries = newQuery(context, [],table,filter,span,alias,emptyInnerJoin,noOrderBy,exclusive);
	let result = await executeQueries(context, queries);
	return resultToRows(context, span,result);
}

getMany.exclusive = function(table,filter,strategy) {
	return getManyCore(table,filter,strategy,true);
};

module.exports = getMany;
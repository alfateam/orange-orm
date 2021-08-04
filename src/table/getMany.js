let newQuery = require('./newQuery');
let executeQueries = require('./executeQueries');
let resultToRows = require('./resultToRows');
let strategyToSpan = require('./strategyToSpan');
let emptyInnerJoin = require('./query/newParameterized')();
let negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');

function getMany(table,filter,strategy) {
	return getManyCore(table,filter,strategy);
}

async function getManyCore(table,filter,strategy,exclusive) {
	let alias = table._dbName;
	let noOrderBy;
	filter = negotiateRawSqlFilter(filter, table);
	let span = strategyToSpan(table,strategy);
	let queries = newQuery([],table,filter,span,alias,emptyInnerJoin,noOrderBy,exclusive);
	let result = await executeQueries(queries);
	return resultToRows(span,result);
}

getMany.exclusive = function(table,filter,strategy) {
	return getManyCore(table,filter,strategy,true);
};

module.exports = getMany;
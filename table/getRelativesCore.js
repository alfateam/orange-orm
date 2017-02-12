var executeQueries = require('./executeQueries');
var resultToRows = require('./resultToRows');
var empty = require('./resultToPromise')(false);
var negotiateExpandInverse = require('./negotiateExpandInverse');
var legNo = 0;

function getRelativesCore(legToQuery, parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	var leg = relation.toLeg();
	var filter = queryContext.filter;
	var alias = queryContext.alias;
	var innerJoin = queryContext.innerJoin;
	var limitQuery = queryContext.limitQuery;
	var query = legToQuery([], alias, leg, legNo, filter, innerJoin, limitQuery);

	return executeQueries(query).then(onResult).then(onRows);

	function onResult(result) {
		return  resultToRows(leg.span, result);
	}

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}
}

module.exports = getRelativesCore;
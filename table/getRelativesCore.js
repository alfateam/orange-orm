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
	var query = legToQuery([], alias, leg, legNo, filter, innerJoin);

	return executeQueries(query).then(onResult);

	function onResult(result) {
		queryContext.expand(relation);
		var rows =  resultToRows(leg.span, result);
		negotiateExpandInverse(parent, relation, rows);
		return rows;
	}
}

module.exports = getRelativesCore;
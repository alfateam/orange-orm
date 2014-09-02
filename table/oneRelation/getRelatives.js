var manyLegToQuery = require('../query/addSubQueries/manyLegToQuery');
var executeQueries = require('../executeQueries');
var resultToRows = require('../resultToRows');
var empty = require('../resultToPromise')(false);
var legNo = 0;

function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	var leg = relation.toLeg();
	var filter = queryContext.filter;
	var alias = queryContext.alias;
	var innerJoin = queryContext.innerJoin;
	var query = manyLegToQuery([], alias, leg, legNo, filter, innerJoin);

	return executeQueries(query).then(onResult);

	function onResult(result) {
		queryContext.expand(relation);
		return resultToRows(leg.span, result);
	}
}

module.exports = getRelatives;
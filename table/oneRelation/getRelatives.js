var strategyToSpan = require('../strategyToSpan');
var newRelativeQuery = require('./newRelativeQuery');
var executeQueries = require('../executeQueries');
var resultToRows = require('../resultToRows');
var empty = require('../resultToPromise')(false);


function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	var join = relation.joinRelation;
	var table = join.childTable;
	var strategy = {};
	strategy[join.leftAlias] = null;
	var span = strategyToSpan(table, strategy);
	var filter = queryContext.filter;
	var alias = queryContext.alias;
	var innerJoin = queryContext.innerJoin;
	var query = newRelativeQuery(table,filter,span,alias,innerJoin);

	return executeQueries(query).then(onResult);

	function onResult(result) {
		queryContext.expand(relation);
		var subSpan;
		span.legs.forEach(onLeg);
		return resultToRows(subSpan, result);

		function onLeg(leg) {
			subSpan = leg.span;
		}
	}
}

module.exports = getRelatives;
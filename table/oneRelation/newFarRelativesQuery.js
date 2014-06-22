var strategyToSpan = require('../strategyToSpan');
var addSubQueries = require('../query/addSubQueries');
var executeQueries = require('../executeQueries');
var resultToRows = require('../resultToRows');

function newFarRelativesQuery(relation, queryContext, name) {
	var table = relation.joinRelation.childTable;
	var strategy = {};
	strategy[name] = null;
	var span = strategyToSpan(table, strategy);
	var queries = [];
	var filter = queryContext.filter;
	var alias = queryContext.alias;
	var innerJoin = queryContext.innerJoin;
	addSubQueries(queries,table,filter,span,alias,innerJoin);

	return executeQueries(queries).then(onResult);

	function onResult(result) {
		var subSpan;
		span.legs.forEach(onLeg);
		return resultToRows(subSpan, result);
		//todo expand relation

		function onLeg(leg) {
			subSpan = leg.span;
		}
	}
}

module.exports = newFarRelativesQuery;
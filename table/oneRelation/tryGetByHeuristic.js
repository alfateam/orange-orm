var empty = require('../resultToPromise')(false);
var getFarRelatives = require('./getFarRelatives');

function tryGetByHeuristic(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	var alias = relation.joinRelation.rightAlias;
	return queryContext.getFarRelatives(alias, parent, relation, getFarRelatives);

}

module.exports = tryGetByHeuristic;
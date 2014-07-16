var empty = require('../resultToPromise')(false);
var getFarRelatives = require('./getFarRelatives');

function tryGetByHeuristic(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	return queryContext.getFarRelatives(parent, relation, getFarRelatives);

}

module.exports = tryGetByHeuristic;
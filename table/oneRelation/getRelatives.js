var empty = require('../resultToPromise')(false);
var getRelatives = require('./getRelatives');

function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;
	if (!queryContext)
		return empty;
	var alias = relation.joinRelation.rightAlias;
	return queryContext.getRelatives(alias, parent, relation, getRelatives);

}

module.exports = getRelatives;
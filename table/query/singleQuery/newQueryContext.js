var newemitEvent = require('../../../emitEvent');

function newQueryContext(filter, alias, innerJoin) {
	var expanders = [];
	var expandRows = newemitEvent();
	var c = {};
	var count = 0;
	c.filter = filter;
	c.alias = alias;
	c.innerJoin = innerJoin;

	c.getFarRelatives = function(relationName, parent, relation, getFarRelatives) {
		if (count == 0) {
			count++;	
			return getFarRelatives(parent, relation).then(onGetFar);
		}

		function onGetFar() {
			expandRows(relationName);
		}
	};

	return c;
}

module.exports = newQueryContext;
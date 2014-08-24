var newemitEvent = require('../../../emitEvent');
var newCollection = require('../../../newCollection');

function newQueryContext(filter, alias, innerJoin) {
	var expanders = [];
	var expandRows = newemitEvent();
	var rows = newCollection();

	var c = {};
	var count = 0;
	c.filter = filter;
	c.alias = alias;
	c.innerJoin = innerJoin;

	c.getRelatives = function(relationName, parent, relation, getRelatives) {
		if (count == 0) {
			count++;	
			return getRelatives(parent, relation).then(onGetFar);
		}

		function onGetFar() {
			expandRows(relationName);
		}
	};

	c.dirty = function(row) {
		rows.remove(row);
	};

	c.add = function(row) {
		//todo
	};

	return c;
}

module.exports = newQueryContext;
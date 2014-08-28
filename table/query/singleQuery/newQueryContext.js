var newCollection = require('../../../newCollection');

function newQueryContext(filter, alias, innerJoin) {
	var rows = newCollection();

	var c = {};
	c.filter = filter;
	c.alias = alias;
	c.innerJoin = innerJoin;

	c.expand = function(relation) {
		rows.forEach(function(row) {
			relation.expand(row);
		});
	};

	c.add = function(row) {
		rows.add(row);
	};

	return c;
}

module.exports = newQueryContext;
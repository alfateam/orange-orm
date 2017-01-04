var newCollection = require('../../newCollection');

function newLeg(relation) {
	var c = {};
	var span = {};	
	span.table = relation.childTable;
	span.legs = newCollection();
	c.span = span;
	c.name = relation.leftAlias;
	c.table = relation.parentTable;
	c.columns = relation.columns;
	c.expand = relation.expand;

	c.accept = function(visitor) {
		visitor.visitJoin(c);
	};

	return c;	
}

module.exports = newLeg;

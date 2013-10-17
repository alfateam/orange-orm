var newCollection = require('../../newCollection');

function newLeg(relation) {
	var c = {};
	var span = {};	
	span.table = relation.childTable;
	span.legs = newCollection();
	c.span = span;
	c.columns = [];
	c.table = relation.parentTable;
	c.columns = relation.columns;

	c.accept = function(visitor) {
		visitor.visitJoin(c);
	};

	return c;	
}

module.exports = newLeg;

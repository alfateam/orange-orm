var newCollection = require('../../newCollection');

function newLeg(relation) {

	var joinRelation = relation.joinRelation;
	var c = {};
	var span = {};		
	span.table = joinRelation.parentTable;	
	span.legs = newCollection();
	c.span = span;
	c.columns = [];
	c.table = joinRelation.childTable;
	c.columns = joinRelation.columns;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	return c;	
}

module.exports = newLeg;

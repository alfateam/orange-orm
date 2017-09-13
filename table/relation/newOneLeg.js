var newCollection = require('../../newCollection');
var newQueryContext = require('../query/singleQuery/newQueryContext');

function newLeg(relation) {

	var joinRelation = relation.joinRelation;
	var c = {};
	c.name = joinRelation.rightAlias;
	var span = {};		
	span.queryContext = newQueryContext();
	span.table = joinRelation.parentTable;	
	span.legs = newCollection();
	c.span = span;
	c.table = joinRelation.childTable;
	c.columns = joinRelation.columns;
	c.expand = relation.expand;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	return c;	
}

module.exports = newLeg;

var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){	
	c.newSubFilter = requireMock('./subFilter');
	c.mock = mock;	
	c.relation = {};
	c.relation2 = {};
	c.childTable = {};
	c.relation2.childTable = c.childTable;
	c.relations = [c.relation,c.relation2];

	c.column = {};
	c.column.equal = mock();
	c.column.between = mock();

	c.column.foo = {};
	c.column.bar = {};

	c.sut = require('../relatedColumn')(c.column,c.relations);
}

module.exports = act;
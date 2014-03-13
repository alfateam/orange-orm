var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.newRelatedColumn = requireMock('./relatedTable/relatedColumn');
	c.mock = mock;	
	c.relation = {};
	c.relation2 = {};
	c.table = {};
	c.col = {};
	c.col.alias = 'a';
	c.col2 = {};
	c.col2.alias = 'b';
	c.table._columns = [c.col,c.col2];
	c.relation2.childTable = c.table;
	c.relations = [c.relation,c.relation2];
	c.a = {};
	c.b = {};

	c.newRelatedColumn.expect(c.col,c.relations).return(c.a);
	c.newRelatedColumn.expect(c.col2,c.relations).return(c.b);

	c.sut = require('../newRelatedTable')(c.relations);
}

module.exports = act;
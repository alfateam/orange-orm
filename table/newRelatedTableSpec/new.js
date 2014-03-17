var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.requireMock = requireMock;
	c.newRelatedColumn = requireMock('./relatedTable/relatedColumn');
	c.mock = mock;	
	c.relation = {name:'first'};
	c.relation2 = {name:'second'};
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

	c.existsFilter = {};
	c.subFilter = requireMock('./relatedTable/subFilter');
	c.subFilter.expect(c.relations).return(c.existsFilter);


	c._childRelations = {};
	c.childRelation = 'c';
	c.childRelation2 = 'c2';
	c._childRelations['child'] = c.childRelation;
	c._childRelations['child2'] = c.childRelation2;
	c.table._relations = c._childRelations; 


	c.sut = require('../newRelatedTable')(c.relations);
}

module.exports = act;
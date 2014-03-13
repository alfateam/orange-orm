var requireMock = require('a').requireMock;
var newJoinRelation = requireMock('./newJoinRelation');
var newRelatedTable = requireMock('./newRelatedTable');
var parentTable = {},
	childTable = {},
	joinRelation = {},
	getRelatedTable = {};

function act(c) {	
	c.newRelatedTable = newRelatedTable;
	c.parentTable = parentTable;
	c.joinRelation = joinRelation;
	parentTable._relations = {};
	newJoinRelation.expect(parentTable,childTable,['foo','baz','bar']).return(joinRelation);
	c.sut = require('../join')(parentTable,childTable);
	c.returned = c.sut.by('foo','baz').by('bar').as('child');
}

module.exports = act;
var requireMock = require('a').requireMock;
var newJoinRelation = requireMock('./newJoinRelation');
var newGetRelatedTable = requireMock('./newGetRelatedTable');
var parentTable = {},
	childTable = {},
	joinRelation = {},
	getRelatedTable = {};

function act(c) {	
	c.getRelatedTable = getRelatedTable;
	c.parentTable = parentTable;
	c.joinRelation = joinRelation;
	parentTable._relations = {};
	newJoinRelation.expect(parentTable,childTable,['foo','baz','bar']).return(joinRelation);
	newGetRelatedTable.expect(joinRelation).return(getRelatedTable);
	c.sut = require('../join')(parentTable,childTable);
	c.returned = c.sut.by('foo','baz').by('bar').as('child');
}

module.exports = act;
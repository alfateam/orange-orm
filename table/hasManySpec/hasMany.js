var requireMock = require('a').requireMock;
var newManyRelation = requireMock('./newManyRelation');
var newGetRelatedTable = requireMock('./newGetRelatedTable');
var joinRelation = {},
	parentTable = {},
	manyRelation = {},
	getRelatedTable = {};

function act(c) {	
	joinRelation.childTable = parentTable;
	c.parentTable = parentTable;
	c.getRelatedTable = getRelatedTable;
	newManyRelation.expect(joinRelation).return(manyRelation);
	newGetRelatedTable.expect(manyRelation).return(getRelatedTable);
	c.sut = require('../hasMany')(joinRelation);
	c.returned = c.sut.as('child');
}

module.exports = act;
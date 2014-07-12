var requireMock = require('a').requireMock;
var newManyRelation = requireMock('./newManyRelation');
var newRelatedTable = requireMock('./newRelatedTable');
var parentTable = {},
	joinRelation = {},
	manyRelation = {};
function act(c) {	
	c.newRelatedTable = newRelatedTable;
	c.manyRelation = manyRelation;
	c.parentTable = parentTable;
	c.joinRelation = joinRelation;
	joinRelation.childTable = parentTable;
	parentTable._relations = {};
	newManyRelation.expect(joinRelation).return(manyRelation);
	c.returned = require('../hasMany')(joinRelation).as('child');
}

module.exports = act;
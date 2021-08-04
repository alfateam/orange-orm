var requireMock = require('a').requireMock;
var newOneRelation = requireMock('./newOneRelation');
var newRelatedTable = requireMock('./newRelatedTable');
var parentTable = {},
	joinRelation = {},
	oneRelation = {};

function act(c) {	
	c.newRelatedTable = newRelatedTable;
	c.oneRelation = oneRelation;
	c.parentTable = parentTable;
	c.joinRelation = joinRelation;
	joinRelation.childTable = parentTable;
	parentTable._relations = {};
	newOneRelation.expect(joinRelation).return(oneRelation);
	c.returned = require('../hasOne')(joinRelation).as('child');
}

module.exports = act;
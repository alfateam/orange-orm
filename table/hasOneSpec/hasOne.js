var requireMock = require('a').requireMock;
var newOneRelation = requireMock('./newOneRelation');
var newGetRelatedTable = requireMock('./newGetRelatedTable');
var parentTable = {},
	joinRelation = {},
	oneRelation = {},
	getRelatedTable = {};

function act(c) {	
	c.getRelatedTable = getRelatedTable;
	c.oneRelation = oneRelation;
	c.parentTable = parentTable;
	joinRelation.childTable = parentTable;
	parentTable._relations = {};
	newOneRelation.expect(joinRelation).return(oneRelation);
	newGetRelatedTable.expect(oneRelation).return(getRelatedTable);
	c.returned = require('../hasOne')(joinRelation).as('child');
}

module.exports = act;
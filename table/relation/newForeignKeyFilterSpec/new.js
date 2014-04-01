var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var joinRelation = {};
var parentRow = {};
var rightTable = {};
var rightColumn1 = {},
	rightColumn2 = {};
var leftColumn1 = {},
	leftColumn2 = {};
var pk1 = {},
	pk2 = {};
var eq1filter = {},
	eq2filter = {};

function act(c){
	c.mock = mock;
	c.filter = {};
	parentRow.rightPk1 = pk1;
	parentRow.rightPk2 = pk2;
	leftColumn1 = {};
	leftColumn2 = {};

	joinRelation.childTable = rightTable;
	rightColumn1.alias = 'rightPk1';
	rightColumn2.alias = 'rightPk2';
	
	rightTable._primaryColumns = [rightColumn1, rightColumn2];
	
	joinRelation.columns = [leftColumn1, leftColumn2];	

	eq1filter.and = mock();
	eq1filter.and.expect(eq2filter).return(c.filter);
	
	leftColumn1.eq = mock();
	leftColumn1.eq.expect(pk1).return(eq1filter);

	leftColumn2.eq = mock();
	leftColumn2.eq.expect(pk2).return(eq2filter);

	c.returned = require('../newForeignKeyFilter')(joinRelation, parentRow);
}

module.exports = act;
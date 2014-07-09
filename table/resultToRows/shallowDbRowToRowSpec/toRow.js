var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var relations = {};


function act(c){


	c.updateField = requireMock('../updateField');
	c.extractStrategy = requireMock('./toDto/extractStrategy');
	c.newToDto = requireMock('./toDto/newToDto');
	c.mock = mock;
	c.table = {};
	c.col1 = {};
	c.alias1 = 'alias1';
	c.col1.alias = c.alias1;
	c.col2 = {};
	c.alias2 = 'alias2';
	c.col2.alias = c.alias2;
	c.table._columns = [c.col1, c.col2];
	c.dbRow = {};
	c.value1 = {};
	c.value2 = {};

	c.dbRow[c.alias1] = c.value1;
	c.dbRow[c.alias2] = c.value2;

	c.lineRelation = {};
	c.customerRelation = {};
	relations.lines = c.lineRelation;
	relations.customer = c.customerRelation;
	c.table._relations = relations;	

	c.emitAlias1Changed = c.mock();
	c.emitAlias2Changed = c.mock();
	c.newEmitEvent = requireMock('../../emitEvent');
	c.newEmitEvent.expect().return(c.emitAlias1Changed);
	c.newEmitEvent.expect().return(c.emitAlias2Changed);

	c.sut = require('../shallowDbRowToRow')(c.table, c.dbRow);

	c.lines = {};	
	c.getLines = c.mock();
	c.getLines.expect().return(c.lines);

	c.lineRelation.toGetRelated = c.mock();
	c.lineRelation.toGetRelated.expect(c.sut).return(c.getLines);

	c.customer = {};
	c.getCustomer = c.mock();
	c.getCustomer.expect().return(c.customer);
	
	c.customerRelation.toGetRelated = c.mock();
	c.customerRelation.toGetRelated.expect(c.sut).return(c.getCustomer);

}

module.exports = act;
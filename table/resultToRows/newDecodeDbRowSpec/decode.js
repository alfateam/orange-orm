var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var relations = {};


function act(c){
	c.mock = mock;
	c.requireMock = requireMock;

	c.updateField = requireMock('../updateField');
	c.extractStrategy = requireMock('./toDto/extractStrategy');
	c.toDto = requireMock('./toDto');
	c.extractDeleteStrategy = requireMock('../extractDeleteStrategy');
	c.newCascadeDeleteStrategy = requireMock('../newCascadeDeleteStrategy');
	c.delete = c.requireMock('./delete');
	
	c.newObject = c.requireMock('../../newObject');	
	
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

	c.dbRowTemplate = {};
	c.dbRowTemplate.a = {};
	c.dbRowTemplate.b = {};
	c.dbRowTemplate.c = {};

	c.dbRow[c.alias1] = c.coreValue1;
	c.dbRow[c.alias2] = c.coreValue2;

	c.lineRelation = {};
	c.customerRelation = {};
	relations.lines = c.lineRelation;
	relations.customer = c.customerRelation;
	c.table._relations = relations;	

	c.newEmitEvent = requireMock('../../emitEvent');
	c.emitArbitaryChanged = c.mock();
	c.newEmitEvent.expect().return(c.emitArbitaryChanged);
	
	c.col1.purify = c.mock();
	c.col1.decode = c.mock();
	c.col1.decode.expect(c.coreValue1).return(c.value1);

	c.col2.purify = c.mock();
	c.col2.decode = c.mock();
	c.col2.decode.expect(c.coreValue2).return(c.value2);

	c.sut = require('../newDecodeDbRow')(c.table, c.dbRowTemplate)(c.dbRow);

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
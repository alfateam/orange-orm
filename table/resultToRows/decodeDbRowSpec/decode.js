var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var relations = {};


function act(c){
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
	c.dbValue1 = {};
	c.dbValue2 = {};
	c.dbValue3 = {};
	c.dbRow.dbValue1 = c.dbValue1;
	c.dbRow.dbValue2 = c.dbValue2;
	c.dbRow.dbValue3 = c.dbValue3;

	c.value1 = {};
	c.col1.decode = mock();
	c.col1.decode.expect(c.dbValue1).return(c.value1);

	c.value2 = {};
	c.col2.decode = mock();
	c.col2.decode.expect(c.dbValue2).return(c.value2);

	c.returned = require('../decodeDbRow')(c.table, c.dbRow);
}

module.exports = act;
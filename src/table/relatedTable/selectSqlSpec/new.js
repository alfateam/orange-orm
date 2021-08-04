var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var table = {};
var alias = 'alias';
var primary = {},
	primary2 = {};
var sql = 'SELECT alias.pk FROM theTable AS alias';
var newParameterized = requireMock('../query/newParameterized');
var newBoolean = requireMock('../column/newBoolean');
var parameterized = {};

function act(c){
	c.expected = {};
	c.mock = mock;
	primary._dbName = 'pk';	
	table._dbName = 'theTable';
	table._primaryColumns = [primary,primary2];

	newParameterized.expect(sql).return(parameterized);
	newBoolean.expect(parameterized).return(c.expected);

	c.returned = require('../selectSql')(table,alias);
}

module.exports = act;
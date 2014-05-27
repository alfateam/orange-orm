var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

function act(c) {
	c.newParameterized =  requireMock('./table/query/newParameterized');
	c.parameterized = {};
	c.newParameterized.expect('').return(c.parameterized);
	c.sql = {};
	c.parameterized.sql = c.sql;
	c.parameters = {};
	c.parameterized.parameters = c.parameters;
	c.input = {};

	c.sut = require('../emptyFilter');
}

module.exports = act;
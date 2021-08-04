var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.command = {};
	c.newParameterized = requireMock('../query/newParameterized');
	c.newParameterized.expect('BEGIN').return(c.command);

	c.sut = require('../beginCommand');
}

module.exports = act;
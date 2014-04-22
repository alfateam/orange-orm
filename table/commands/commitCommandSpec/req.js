var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.command = {};
	c.newParameterized = requireMock('../query/newParameterized');
	c.newParameterized.expect('COMMIT').return(c.command);

	c.sut = require('../commitCommand');
}

module.exports = act;
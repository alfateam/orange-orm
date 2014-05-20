var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.requireMock = requireMock;
	c.mock = mock;	
	c.table = {};
	c.sut = require('../extractStrategy');
}

module.exports = act;
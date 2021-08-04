var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.expected = {};
	c.column = {};
	c.arg = {};
	c.column.encode = c.mock();

	c.sut = require('../encodeFilterArg');
}

module.exports = act;
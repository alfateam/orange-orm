var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;

	c.expected = {};
	
	c.startsWithCore = c.requireMock('./startsWithCore');	
	
	c.startsWithCore.bind = c.mock();	
	c.startsWithCore.bind.expect(null, 'LIKE').return(c.expected);
	
	c.sut = require('../startsWith');
}

module.exports = act;
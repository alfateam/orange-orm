var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;

	c.expected = {};
	
	c.startsWithCore = c.requireMock('./startsWithCore');	
	
	c.startsWithCore.bind = c.mock();	
	c.startsWithCore.bind.expect(null, 'ILIKE').return(c.expected);
	
	c.sut = require('../iStartsWith');
}

module.exports = act;
var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;

	c.expected = {};
	
	c.endsWithCore = c.requireMock('./endsWithCore');	
	
	c.endsWithCore.bind = c.mock();	
	c.endsWithCore.bind.expect(null, 'LIKE').return(c.expected);
	
	c.sut = require('../endsWith');
}

module.exports = act;
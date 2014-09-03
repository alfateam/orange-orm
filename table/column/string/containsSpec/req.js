var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;

	c.expected = {};
	
	c.containsCore = c.requireMock('./containsCore');	
	
	c.containsCore.bind = c.mock();	
	c.containsCore.bind.expect(null, 'LIKE').return(c.expected);
	
	c.sut = require('../contains');
}

module.exports = act;
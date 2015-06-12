var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.tryParseISO = c.requireMock('./tryParseISO');
	c.cloneDate = c.requireMock('./cloneDate');
	
	
	c.sut = require('../purify');
}

module.exports = act;
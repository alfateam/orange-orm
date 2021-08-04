var a = require('a');

function act(c) {
	c.requireMock = a.requireMock;
	c.purify = c.requireMock('./purify');
	c.column = {};
	
	c.sut = require('../newDecode')(c.column);
}

module.exports = act;
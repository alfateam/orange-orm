var requireMock = require('a').requireMock;
var column = {};

function act(c) {
	c.arg = {};
	c.column = column;
	c.purify = requireMock('./purify');
	c.sut = require('../newEncode')(column);
}

module.exports = act;
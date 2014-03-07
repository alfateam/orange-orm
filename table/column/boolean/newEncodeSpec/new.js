var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;
var column = {};

function act(c) {
	c.arg = {};
	c.purify = requireMock('./purify');

	c.newParam = requireMock('../../query/newParameterized');

	c.mock = mock;
	c.requireMock = requireMock;
	c.column = column;
	c.sut = require('../newEncode')(column);
}

module.exports = act;
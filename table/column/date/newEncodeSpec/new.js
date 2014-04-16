var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var column = {};

function act(c) {
	c.initArg = {};
	c.mock = mock;
	c.column = column;

	c.newParam = requireMock('../../query/newParameterized');
	c.purify = requireMock('./purify');

	c.sut = require('../newEncode')(column);
}

module.exports = act;
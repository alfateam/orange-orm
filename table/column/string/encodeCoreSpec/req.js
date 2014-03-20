var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var column = {};

function act(c) {
	c.mock = mock;
	c.column = column;

	c.newParam = requireMock('../../query/newParameterized');
	c.stringIsSafe = requireMock('./stringIsSafe');

	c.sut = require('../encodeCore');
}

module.exports = act;
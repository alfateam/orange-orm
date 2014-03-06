var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;
var column = {};

var newSut = require('../newEncode');

function act(c) {
	c.mock = mock;
	c.requireMock = requireMock;
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
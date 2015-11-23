var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
	c.initArg = {};
	c.mock = mock;
	c.column = {};
	c.purify = c.mock();

	c.newParam = requireMock('../query/newParameterized');

	c.sut = require('../newEncodeSafe')(c.column, c.purify);
}

module.exports = act;
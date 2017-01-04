var requireMock = require('a').requireMock;
var column = {};

function act(c) {
	c.column = column;

	c.newParam = requireMock('../../query/newParameterized');
	c.purify = requireMock('./purify');

	c.sut = require('../newEncode')(column);
}

module.exports = act;
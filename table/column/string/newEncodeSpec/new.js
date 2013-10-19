var requireMock = require('a').requireMock;
var column = {};

var newSut = require('../newEncode');

function act(c) {
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
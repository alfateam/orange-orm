var requireMock = require('a').requireMock;
var column = {};

var newSut = require('../newEncodeCore');

function act(c) {
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
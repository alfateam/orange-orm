var requireMock = require('a').requireMock;
var stringToBase64 = requireMock('../../../stringToBase64');
var column = {};

var newSut = require('../newEncode');

function act(c) {
	c.stringToBase64 = stringToBase64;
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
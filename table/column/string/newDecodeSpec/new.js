var column = {};

var newSut = require('../newDecode');

function act(c) {
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
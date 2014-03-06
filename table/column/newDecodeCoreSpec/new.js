var column = {};

var newSut = require('../newDecodeCore');

function act(c) {
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
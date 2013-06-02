var column = {};

function act(c) {
	c.column = column;
	c.sut = require('../newEncode')(column);
}

module.exports = act;
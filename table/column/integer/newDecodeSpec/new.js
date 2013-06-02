var column = {};

function act(c) {
	c.column = column;
	c.sut = require('../newDecode')(column);
}

module.exports = act;
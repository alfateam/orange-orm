function act(c) {
	c.mock = require('a').mock;
	c.sut = require('../purify');
}

module.exports = act;
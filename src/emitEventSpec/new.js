function act(c) {
	c.mock = require('a').mock;
	c.sut = require('../emitEvent')();
}

module.exports = act;
var a = require('a_mock');


function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
	c.sut = require('../newCollection')();
}

module.exports = act;
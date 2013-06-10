var a = require('a_mock');


function act(c) {
	c.element = {};
	c.element2 = {};
	c.requireMock = a.requireMock;
	c.mock = a.mock;
	c.sut = require('../newCollection')(c.element,c.element2);
}

module.exports = act;
var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	process.domain = {};
	c.expected = {};
	process.domain.rdb = c.expected;

	c.returned = require('../getSessionContext')();
}

module.exports = act;
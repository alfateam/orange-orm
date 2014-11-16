var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	process.domain = {};
	process.domain.rdb = {};

	c.sut = require('../deleteSessionContext')();
}

module.exports = act;
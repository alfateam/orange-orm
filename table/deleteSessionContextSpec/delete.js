var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	var oldDomain = process.domain;
	c.domain = {};
	process.domain = c.domain;
	process.domain.rdb = {};
	c.sut = require('../deleteSessionContext')();
	process.domain = oldDomain;
}

module.exports = act;
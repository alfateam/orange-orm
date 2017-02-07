var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	c.getSessionSingleton = c.requireMock('./getSessionSingleton');
	

	c.sut = require('../encodeDbSpecific');
}

module.exports = act;
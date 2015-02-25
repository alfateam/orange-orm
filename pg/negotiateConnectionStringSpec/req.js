var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.newId = c.requireMock('../newId');

	c.sut = require('../negotiateConnectionString');
}

module.exports = act;
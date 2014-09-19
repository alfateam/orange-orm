var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	
	c.domain = {};
	c.pool = {};

	c.wrapQuery = c.requireMock('./wrapQuery');

	c.sut = require('../newTransaction')(c.domain, c.pool);
}

module.exports = act;
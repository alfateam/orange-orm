var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.filter = {};
	c.filter2 = {};
	c.filter2.sql = c.mock();

	c.sut = require('../negotiateNextAndFilter');
}

module.exports = act;
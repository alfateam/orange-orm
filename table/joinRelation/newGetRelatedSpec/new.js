var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.parent = {};
	c.relation = {};
	
	c.sut = require('../newGetRelated')(c.parent, c.relation);
}

module.exports = act;
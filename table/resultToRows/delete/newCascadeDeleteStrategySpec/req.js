var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.newObject = c.requireMock('../../../newObject');	
	
	c.sut = require('../newCascadeDeleteStrategy');
}

module.exports = act;
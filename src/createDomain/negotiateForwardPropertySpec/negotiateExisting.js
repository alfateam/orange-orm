var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.newDomain = {};
	c.oldDomain = {};

	c.oldFoo = {};
	c.existingFoo = {};
	c.oldDomain.foo = c.oldFoo;
	c.newDomain.foo = c.existingFoo;
	c.propertyName = 'foo';

	require('../negotiateForwardProperty')(c.oldDomain, c.newDomain, c.propertyName);
}

module.exports = act;
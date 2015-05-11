var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.newDomain = {};
	c.oldDomain = {};

	c.oldFoo = {};
	c.newFoo = {};
	c.oldDomain.foo = c.oldFoo;
	c.propertyName = 'foo';

	require('../negotiateForwardProperty')(c.oldDomain, c.newDomain, c.propertyName);
	c.originalValue = c.newDomain.foo;
	c.newDomain.foo = c.newFoo;
}

module.exports = act;
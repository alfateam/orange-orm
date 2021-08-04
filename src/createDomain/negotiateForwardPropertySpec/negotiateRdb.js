var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.newDomain = {};
	c.oldDomain = {};

	c.oldRdb = {};
	c.oldDomain.rdb = c.oldRdb;
	c.propertyName = 'rdb';

	require('../negotiateForwardProperty')(c.oldDomain, c.newDomain, c.propertyName);

}

module.exports = act;
var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.emptyStrategy = {};
	c.newObject = c.requireMock('../newObject');
	c.newObject.expect().return(c.emptyStrategy);
		
	c.sut = require('../extractDeleteStrategy');
}

module.exports = act;
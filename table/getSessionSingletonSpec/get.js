var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.expected = {};
	c.context = {};
	c.context.foo = c.expected;

	c.getSessionContext = c.requireMock('./getSessionContext');
	c.getSessionContext.expect().return(c.context);

	c.returned = require('../getSessionSingleton')('foo');
}

module.exports = act;
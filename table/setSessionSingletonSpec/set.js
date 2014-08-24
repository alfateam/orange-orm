var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.context = {};

	c.getSessionContext = c.requireMock('./getSessionContext');
	c.getSessionContext.expect().return(c.context);

	c.expected = {};
	
	require('../setSessionSingleton')('foo', c.expected);
}

module.exports = act;
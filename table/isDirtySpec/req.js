var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.expected = {};

	c.getSessionSingleton = c.requireMock('./getSessionSingleton');
	c.getSessionSingleton.bind = c.mock();
	c.getSessionSingleton.bind.expect(null,'isDirty').return(c.expected);

	c.returned = require('../isDirty');
}

module.exports = act;
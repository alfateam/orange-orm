var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.connection = {};
	c.executeQuery = c.mock();
	c.connection.executeQuery = c.executeQuery;
	
	c.sut = require('../wrapQueryStream')(c.connection);
}

module.exports = act;
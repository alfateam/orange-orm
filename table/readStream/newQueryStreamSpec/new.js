var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.getSessionSingleton = c.requireMock('../getSessionSingleton');
	c.dbClient = {};
	c.getSessionSingleton.expect('dbClient').return(c.dbClient);

	c.dbClient.streamQuery = c.mock();
	c.expected = {};
	c.query = {};
	c.streamOptions = {};
	c.dbClient.streamQuery.expect(c.query, c.streamOptions).return(c.expected);

	c.returned = require('../newQueryStream')(c.query, c.streamOptions);
}

module.exports = act;
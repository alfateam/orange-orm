var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.log = c.requireMock('../table/log');
	
	c.connection = {};
	c.replaceParamChar = c.requireMock('./replaceParamChar');

	c.runQuery = c.mock();
	c.connection.query = c.runQuery;
	
	c.sut = require('../wrapQuery')(c.connection);
}

module.exports = act;
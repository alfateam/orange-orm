var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.query = {};
	c.query.sql = c.mock();

	c.sut = require('../replaceParamChar');
}

module.exports = act;
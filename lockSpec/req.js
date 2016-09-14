var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.query = c.requireMock('./query');	
	c.toIntKey = c.requireMock('./lock/toIntKey');

	c.sut = require('../lock');
}

module.exports = act;
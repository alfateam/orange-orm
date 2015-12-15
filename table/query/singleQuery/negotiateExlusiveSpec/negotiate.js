var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.table = {};
	c.tableWithExclusive = {
		_exclusive: true
	};
	c.sut = require('../negotiateExclusive');
}

module.exports = act;
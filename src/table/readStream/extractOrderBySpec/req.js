var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	c.table = {};
	c.alias = 'alias';
	c.span = {
		table: c.table
	};
	c.sut = require('../extractOrderBy');
}

module.exports = act;
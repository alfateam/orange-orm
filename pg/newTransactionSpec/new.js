var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;
	c.requireMock = requireMock;

	c.pool = {};
	c.domain = {};

	c.wrapQuery = requireMock('./wrapQuery');
	c.encodeBuffer = c.requireMock('./encodeBuffer');

	c.deleteFromSql = c.requireMock('./deleteFromSql');

	c.sut = require('../newTransaction')(c.domain, c.pool);
}

module.exports = act;
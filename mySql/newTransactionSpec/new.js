var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	
	c.domain = {};
	c.pool = {};

	c.wrapQuery = c.requireMock('./wrapQuery');
	c.deleteFromSql = c.requireMock('./deleteFromSql');
	c.selectForUpdateSql = c.requireMock('./selectForUpdateSql');
	c.encodeDate = c.requireMock('./encodeDate');
	
	
	c.sut = require('../newTransaction')(c.domain, c.pool);
}

module.exports = act;
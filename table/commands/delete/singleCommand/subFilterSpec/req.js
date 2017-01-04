var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.newSelectSql = c.requireMock('./selectSql');
	c.newJoinSql = c.requireMock('./joinSql');
	c.newWhereSql = c.requireMock('./whereSql');
	c.createAlias = c.requireMock('../createAlias');

	c.sut = require('../subFilter')
}

module.exports = act;
var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.leftAlias = {};
	c.rightAlias = {};
	c.primaryColumns = {};
	c.table = {};
	c.table._primaryColumns = c.primaryColumns;
	c.expected = {};

	c.newShallowJoinSqlCore = c.requireMock('../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
	c.newShallowJoinSqlCore.expect(c.table, c.primaryColumns, c.primaryColumns, c.leftAlias, c.rightAlias).return(c.expected);

	c.sut = require('../newSelfJoin')(c.table, c.leftAlias, c.rightAlias);
}

module.exports = act;
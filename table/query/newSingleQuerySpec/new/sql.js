var mock = require('a_mock').mock;

var columnSql = '<columnSql>';
var whereSql = ' <whereSql>';
var joinSql = ' <joinSql>';
var tableName = '<tableName>';
var expected = 'select <columnSql> from <tableName> <joinSql> <whereSql>';


function act(c) {
	//todo
	c.table.name = tableName;
	c.newWhereSql.expect(c.filter).return(whereSql);
	c.newJoinSql.expect(c.span,c.alias).return(joinSql);
	c.newColumnSql.expect(c.table,c.span,c.alias).return(columnSql);
	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
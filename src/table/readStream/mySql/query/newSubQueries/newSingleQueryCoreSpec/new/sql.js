var mock = require('a').mock;

var columnSql = '<columnSql>';
var whereSql = ' <whereSql>';
var joinSql = ' <joinSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var expected = 'json_object(<columnSql> <subQueries>)';

function act(c) {
	c.table._dbName = tableName;
	c.newColumnSql.expect(c.table,c.alias).return(columnSql);
	c.expected = expected;
	c.returned = c.sut.sql();
}

module.exports = act;
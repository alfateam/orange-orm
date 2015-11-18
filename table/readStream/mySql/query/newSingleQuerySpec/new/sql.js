var mock = require('a').mock;

var columnSql = '<columnSql>';
var whereSql = ' <whereSql>';
var joinSql = ' <joinSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var expected = 'select json_object(<columnSql> <subQueries>) from <tableName> _2 <whereSql> <orderBy>';

function act(c) {
	c.filter.and = c.mock();
	
	c.table._dbName = tableName;
	c.newWhereSql.expect(c.table,c.filter,c.alias).return(whereSql);
	c.newColumnSql.expect(c.table,c.alias).return(columnSql);
	c.expected = expected;
	c.returned = c.sut.sql();
}

module.exports = act;
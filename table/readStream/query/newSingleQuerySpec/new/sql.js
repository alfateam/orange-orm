var mock = require('a').mock;

var columnSql = '<columnSql>';
var whereSql = ' <whereSql>';
var joinSql = ' <joinSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var expected = 'select <columnSql> from <tableName> _2 <whereSql> <orderBy>';

function act(c) {
	c.filter.and = c.mock();
	c.filterWithJoin = {};
	c.filter.and.expect(joinSql).return(c.filterWithJoin);
	
	c.table._dbName = tableName;
	c.newWhereSql.expect(c.table,c.filterWithJoin,c.alias).return(whereSql);
	c.newJoinSql.expect(c.span,c.alias).return(joinSql);
	c.newColumnSql.expect(c.table,c.alias).return(columnSql);
	c.expected = expected;
	c.returned = c.sut.sql();
}

module.exports = act;
var mock = require('a').mock;

var columnSql = '<columnSql>';
var whereSql = ' <whereSql>';
var joinSql = ' <joinSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var safeLimit = ' <limit>';
var exclusive = ' <exclusive>';
var expected = 'select <columnSql> from <tableName> _2 <innerJoinSql> <joinSql> <whereSql> <orderBy> <limit> <exclusive>';

function act(c) {
	c.innerJoin.sql = mock();
	c.innerJoin.sql.expect().return(innerJoinSql);
	c.table._dbName = tableName;
	c.newWhereSql.expect(c.table,c.filter,c.alias).return(whereSql);
	c.newJoinSql.expect(c.span,c.alias).return(joinSql);
	c.newColumnSql.expect(c.table,c.span,c.alias).return(columnSql);
	c.negotiateLimit.expect(c.limit).return(safeLimit);
	c.negotiateExclusive.expect(c.table).return(exclusive);
	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
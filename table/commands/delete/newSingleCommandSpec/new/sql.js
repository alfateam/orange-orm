var mock = require('a').mock;

var whereSql = ' <whereSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var expected = 'delete from <tableName> _2 <innerJoinSql> <whereSql>';

function act(c) {
	c.innerJoin.sql = mock();
	c.innerJoin.sql.expect().return(innerJoinSql);
	c.table._dbName = tableName;
	c.newWhereSql.expect(c.table,c.filter,c.alias).return(whereSql);
	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
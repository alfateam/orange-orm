var mock = require('a').mock;

var whereSql = ' <whereSql>';
var innerJoinSql = ' <innerJoinSql>'
var tableName = '<tableName>';
var expected = 'delete from <tableName> _0 where (exists (select 1)) <innerJoinSql> <whereSql>';

function act(c) {
	c.innerJoin = {};
	c.innerJoin.sql = mock();
	c.innerJoin.sql.expect().return(innerJoinSql);
	c.table._dbName = tableName;

	

	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
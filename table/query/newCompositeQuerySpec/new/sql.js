var mock = require('a').mock;
var sql = {};

function act(c) {
	var sql = mock();
	sql.expect().return(sql);
	c.compositeSql.sql = sql;
	c.sql = sql;
	c.returned = c.sut.sql();
}
act.base = '../new'
module.exports  = act;
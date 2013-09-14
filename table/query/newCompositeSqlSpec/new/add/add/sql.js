var mock = require('a').mock;

var query1Sql = 'select foo';
var query2Sql = 'select bar';
var expected = 'select foo;select bar';

function act(c) {

	c.query.sql = mock();
	c.query.sql.expect().return(query1Sql);

	c.query2.sql = mock();
	c.query2.sql.expect().return(query2Sql);

	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../add';
module.exports = act;
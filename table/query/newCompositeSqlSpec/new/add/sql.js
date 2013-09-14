var mock = require('a').mock;

var expected = 'foo';

function act(c) {
	var _sql = mock();
	_sql.expect().return(expected);
	c.query.sql = _sql;
	c.expected = expected;
	c.returned = c.sut.sql();
}

act.base = '../add';
module.exports = act;
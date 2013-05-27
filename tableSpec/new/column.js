var requireMock = require('a_mock').requireMock;
var columnName = {};
var expected = {};

function act(c) {
	c.expected = expected;
	c.column.expect(c.sut).expect(columnName).return(c.expected);
	c.returned = c.sut.column(columnName);
}

act.base = '../new';
module.exports = act;
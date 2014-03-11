var requireMock = require('a').requireMock;
var columnName = {};
var expected = {};
var columnDef = {};

function act(c) {
	c.expected = expected;
	c.newColumn.expect(c.sut,columnName).return(columnDef);
	c.column.expect(columnDef, c.sut).return(c.expected);
	c.returned = c.sut.column(columnName);
}

act.base = '../new';
module.exports = act;
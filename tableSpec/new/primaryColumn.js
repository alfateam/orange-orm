var requireMock = require('a_mock').requireMock;
var primaryColumnName = {};

function act(c) {
	c.expected = {};
	c.primaryColumn.expect(c.sut).expect(primaryColumnName).return(c.expected);
	c.returned = c.sut.primaryColumn(primaryColumnName);
}

act.base = '../new';
module.exports = act;
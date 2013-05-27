var requireMock = require('a_mock').requireMock;
var expected = {};

function act(c) {
	var addString = requireMock('./column/string');
	c.expected = expected;
	addString.expect(c.sut).return(expected);
	c.returned = c.sut.string();
}

act.base = '../new';
module.exports = act;
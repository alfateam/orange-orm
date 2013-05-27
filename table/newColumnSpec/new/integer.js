var requireMock = require('a_mock').requireMock;
var expected = {};

function act(c) {
	var add = requireMock('./column/integer');
	c.expected = expected;
	add.expect(c.sut).return(expected);
	c.returned = c.sut.integer();
}

act.base = '../new';
module.exports = act;
var requireMock = require('a_mock').requireMock;
var expected = {};

function act(c) {
	var add = requireMock('./column/float');
	c.expected = expected;
	add.expect(c.sut).return(expected);
	c.returned = c.sut.float();
}

act.base = '../new';
module.exports = act;
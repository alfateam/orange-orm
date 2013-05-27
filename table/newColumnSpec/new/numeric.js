var requireMock = require('a_mock').requireMock;
var expected = {};
var precision = {};
var scale = {};

function act(c) {
	var add = requireMock('./column/numeric');
	c.expected = expected;
	add.expect(c.sut,precision,scale).return(expected);
	c.returned = c.sut.numeric(precision,scale);
}

act.base = '../new';
module.exports = act;
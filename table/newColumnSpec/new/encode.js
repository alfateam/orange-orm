var newMock = require('a_mock').mock;
var encode = newMock();
var type = {};
type.encode = encode;
var expected = {};
var arg  = {};

function act(c) {
	encode.expect(arg).return(expected);
	c.sut.type = type;
	c.expected = expected;
	c.returned = c.sut.encode(arg);
}

act.base = '../new';
module.exports = act;
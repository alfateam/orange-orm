var newMock = require('a_mock').mock;
var decode = newMock();
var type = {};
type.decode = decode;
var expected = {};
var arg  = {};

function act(c) {
	decode.expect(arg).return(expected);
	c.sut.type = type;
	c.expected = expected;
	c.returned = c.sut.decode(arg);
}

act.base = '../new';
module.exports = act;
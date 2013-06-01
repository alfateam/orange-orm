var arg = 'arg';
var mock = require('a_mock').mock;
var converted = {};

function act(c) {
	c.expected = {};
	c.sut.convert = mock();
	c.sut.convert.expect(arg).return(converted);
	c.sut.encode = mock();
	c.sut.encode.expect(converted).return(c.expected);
	c.returned = c.sut.convertThenEncode(arg);
}

act.base = '../new';
module.exports = act;
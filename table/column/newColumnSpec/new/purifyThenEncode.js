var arg = 'arg';
var mock = require('a_mock').mock;
var purifyed = {};

function act(c) {
	c.expected = {};
	c.sut.purify = mock();
	c.sut.purify.expect(arg).return(purifyed);
	c.sut.encode = mock();
	c.sut.encode.expect(purifyed).return(c.expected);
	c.returned = c.sut.purifyThenEncode(arg);
}

act.base = '../new';
module.exports = act;
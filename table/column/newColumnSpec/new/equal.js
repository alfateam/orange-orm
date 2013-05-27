var arg = 'arg';
var mock = require('a_mock').mock;

function act(c) {
	c.expected = {};
	c.filter.equal = mock();
	c.filter.equal.expect(c.sut).expect(arg).return(c.expected);
	c.returned = c.sut.equal(arg);
}

act.base = '../new';
module.exports = act;
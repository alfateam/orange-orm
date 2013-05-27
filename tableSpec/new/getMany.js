var requireMock = require('a_mock').requireMock;
var filter = {};
var expected = {};

function act(c) {
	c.expected = expected;
	c.getMany.expect(c.sut).expect(filter).return(c.expected);
	c.returned = c.sut.getMany(filter);
}

act.base = '../new';
module.exports = act;
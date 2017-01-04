var requireMock = require('a').requireMock;
var filter = {};
var strategy = {};
var expected = {};

function act(c) {
	c.expected = {};
	c.expectedExclusive = {};
	c.getMany.expect(c.sut).expect(filter,strategy).return(c.expected);
	c.returned = c.sut.getMany(filter,strategy);
	c.getMany.exclusive.expect(c.sut).expect(filter,strategy).return(c.expectedExclusive);
	c.returnedExclusive = c.sut.getMany.exclusive(filter,strategy);
}

act.base = '../new';
module.exports = act;
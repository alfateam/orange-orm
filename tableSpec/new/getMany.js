var requireMock = require('a').requireMock;
var filter = {};
var expected = {};

function act(c) {
	c.expected = {};
	c.expectedExclusive = {};
	c.getMany.expect(c.sut).expect(filter).return(c.expected);
	c.returned = c.sut.getMany(filter);
	c.getMany.exclusive.expect(c.sut).expect(filter).return(c.expectedExclusive);
	c.returnedExclusive = c.sut.getMany.exclusive(filter);
}

act.base = '../new';
module.exports = act;
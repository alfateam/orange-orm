var requireMock = require('a').requireMock;
var joinRelation = {};
var expected = {};

function act(c) {
	c.expected = expected;
	c.hasOne.expect(joinRelation).return(c.expected);
	c.returned = c.sut.hasOne(joinRelation);
}

act.base = '../new';
module.exports = act;
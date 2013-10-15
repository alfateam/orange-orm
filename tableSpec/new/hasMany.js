var requireMock = require('a').requireMock;
var joinRelation = {};
var expected = {};

function act(c) {
	c.expected = expected;
	c.hasMany.expect(joinRelation).return(c.expected);
	c.returned = c.sut.hasMany(joinRelation);
}

act.base = '../new';
module.exports = act;
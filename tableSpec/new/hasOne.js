var requireMock = require('a').requireMock;
var table = {};
var expected = {};

function act(c) {
	c.expected = expected;
	c.hasOne.expect(c.sut,table).return(c.expected);
	c.returned = c.sut.hasOne(table);
}

act.base = '../new';
module.exports = act;
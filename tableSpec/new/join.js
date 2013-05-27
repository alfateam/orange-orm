var requireMock = require('a_mock').requireMock
var table = {};
var expected = {};

function act(c) {
	c.expected = expected;	
	c.join.expect(c.sut,table).return(expected);
	c.returned = c.sut.join(table);
}

act.base = '../new';
module.exports = act;
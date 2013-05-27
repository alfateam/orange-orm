var requireMock = require('a_mock').requireMock;
var nullValue  = {};

function act(c) {
	c.nullValue = nullValue;
	c.returned = c.sut.dbNull(nullValue);
}

act.base = '../new';
module.exports = act;
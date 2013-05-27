var requireMock = require('a_mock').requireMock;
var expected = {};
var defaultValue  = {};

function act(c) {
	c.default = defaultValue;
	c.returned = c.sut.default(defaultValue);
}

act.base = '../new';
module.exports = act;
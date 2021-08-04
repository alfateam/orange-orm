var requireMock = require('a').requireMock;
var defaultValue  = {};

function act(c) {
	c.default = defaultValue;
	c.returned = c.sut.default(defaultValue);
}

act.base = '../new';
module.exports = act;
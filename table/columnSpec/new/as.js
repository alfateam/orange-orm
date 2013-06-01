var requireMock = require('a_mock').requireMock;
var alias  = {};

function act(c) {
	c.alias = alias;
	c.returned = c.sut.as(alias);
}

act.base = '../new';
module.exports = act;
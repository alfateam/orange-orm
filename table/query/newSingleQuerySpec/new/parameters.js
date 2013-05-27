var mock = require('a_mock').mock;
var expected = {};

function act(c) {
	c.filter.parameters = mock();
	c.filter.parameters.expect().return(expected);
	c.expected = expected;
	c.returned = c.sut.parameters();
}

act.base = '../new';
module.exports = act;



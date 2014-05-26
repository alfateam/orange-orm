var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

function act(c) {
	c.newPromise = mock();
	c.expected = {};
	c.newPromise = requireMock('./promise');
	c.newPromise.expect(null).return(c.expected);
	c.returned = require('../nullPromise');
}

module.exports = act;
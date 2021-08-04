var requireMock = require('a').requireMock;

function act(c) {
	c.serializable = {};
	c.returned = c.sut.serializable(c.serializable);
}

module.exports = act;
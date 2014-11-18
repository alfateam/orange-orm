var arg = null;

function act(c) {
	c.expected = arg;
	c.returned = c.sut(arg);
}

module.exports = act;
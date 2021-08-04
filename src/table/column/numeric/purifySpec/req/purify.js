var arg = 2.23;

function act(c) {
	c.arg = arg;
	c.expected = arg;
	c.returned = c.sut(arg);
}

module.exports = act;
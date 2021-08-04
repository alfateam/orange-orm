var arg = Buffer.from([1,2]);

function act(c) {
	c.arg = arg;
	c.expected = arg;
	c.returned = c.sut(arg);
}

module.exports = act;
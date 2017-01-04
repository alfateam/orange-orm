var arg = {a: 'foo', b: 'bar'};

function act(c) {
	c.arg = arg;
	c.expected = arg;
	c.returned = c.sut(arg);
}

module.exports = act;
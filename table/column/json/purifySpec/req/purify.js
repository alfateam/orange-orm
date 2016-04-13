var arg = {a: 'foo', b: 'bar'};

function act(c) {
	c.arg = arg;
	c.expected = '{"a":"foo","b":"bar"}';
	c.returned = c.sut(arg);
}

module.exports = act;
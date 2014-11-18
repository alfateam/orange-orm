var arg = new Date('2014-05-11 06:49:40.297-0200');

function act(c) {
	c.arg = arg;
	c.expected = arg;
	c.returned = c.sut(arg);
}

module.exports = act;
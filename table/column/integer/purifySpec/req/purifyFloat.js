var arg = 2.23;

function act(c) {
	c.arg = arg;
	c.expected = 2;
	c.returned = c.sut(arg);
};

act.base = '../req';
module.exports = act;
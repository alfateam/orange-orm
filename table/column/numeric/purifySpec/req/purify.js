var arg = 2;

function act(c) {
	c.arg = arg;
	c.expected = arg;
	c.returned = c.sut(arg);
};

act.base = '../req';
module.exports = act;
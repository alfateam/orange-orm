var arg = null;

function act(c) {
	c.expected = arg;
	c.returned = c.sut(arg);
}

act.base = '../req';
module.exports = act;
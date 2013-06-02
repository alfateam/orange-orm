function act(c) {
	c.expected = '2';
	c.returned = c.sut(2);
}

act.base = '../new';
module.exports = act;
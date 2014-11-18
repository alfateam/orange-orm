function act(c) {
	c.expected = null;
	c.returned = c.sut();
}

module.exports = act;
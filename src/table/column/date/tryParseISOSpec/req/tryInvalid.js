function act(c) {
	var arg = new Date().toString();
	c.returned = c.sut(arg);
}

module.exports = act;
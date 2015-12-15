function act(c){
	c.expected = {};
	for (var i in c.sut) {
		c.expected[i] = c.sut[i];
	}
	c.expected._exclusive = true;
	c.returned = c.sut.exclusive();
}

module.exports = act;
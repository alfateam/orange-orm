function act(c) {
	c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
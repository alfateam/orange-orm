function act(c) {
	c.sut.remove(c.callback);
}

act.base = '../add';
module.exports = act;
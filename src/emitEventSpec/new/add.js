
function act(c) {
	c.callback = c.mock();
	c.callback2 = c.mock();
	c.sut.add(c.callback);
	c.sut.add(c.callback2);
}

act.base = '../new';
module.exports = act;
var callback;

function act(c) {
	callback = c.mock();
	c.callback = callback;
	c.sut.forEach(callback);
}

act.base = '../new'
module.exports = act;
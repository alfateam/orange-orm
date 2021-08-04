var callback;

function act(c) {
	callback = c.mock();
	callback.expect(c.element,0);
	callback.expect(c.element2,1);
	c.callback = callback;
	c.sut.forEach(callback);
}

module.exports = act;
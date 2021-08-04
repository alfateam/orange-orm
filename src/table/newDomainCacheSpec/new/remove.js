function act(c){
	c.stubCache();
	c.expected = {};

	c.key = {};
	c.cache.tryRemove = c.mock();
	c.cache.tryRemove.expect(c.key);

	c.sut.tryRemove(c.key);
}

module.exports = act;
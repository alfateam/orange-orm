function act(c){
	c.stubCache();

	c.cb = {};
	c.cache.subscribeAdded = c.mock();
	c.cache.subscribeAdded.expect(c.cb);

	c.sut.subscribeAdded(c.cb);
}

module.exports = act;
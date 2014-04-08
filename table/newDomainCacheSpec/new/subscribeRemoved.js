function act(c){
	c.stubCache();

	c.cb = {};
	c.cache.subscribeRemoved = c.mock();
	c.cache.subscribeRemoved.expect(c.cb);

	c.sut.subscribeRemoved(c.cb);
}

module.exports = act;
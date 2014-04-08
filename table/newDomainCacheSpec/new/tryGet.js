function act(c){
	c.stubCache();
	c.key = {};
	c.cache.tryGet = c.mock();
	c.expected = {};
	c.cache.tryGet.expect(c.key).return(c.expected);

	c.returned = c.sut.tryGet(c.key);
}

module.exports = act;
function act(c){
	c.stubCache();
	c.expected = {};

	c.key = {};
	c.value = {};
	c.cache.tryAdd = c.mock();
	c.cache.tryAdd.expect(c.key, c.value).return(c.expected);

	c.returned = c.sut.tryAdd(c.key, c.value);
}

module.exports = act;
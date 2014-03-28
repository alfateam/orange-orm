function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;

	c.key = {};
	c.cache.tryGet = c.mock();
	c.expected = {};	
	c.cache.tryGet.expect(c.key).return(c.expected);
	c.newCache.expect().return(c.cache);

	c.returned = c.sut.tryGet(c.key);
}

module.exports = act;
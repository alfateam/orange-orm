function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;
	c.domain[c.id] = c.cache;


	c.key = {};
	c.cache.tryGet = c.mock();
	c.expected = {};
	c.cache.tryGet.expect(c.key).return(c.expected);

	c.returned = c.sut.tryGet(c.key);
}

module.exports = act;
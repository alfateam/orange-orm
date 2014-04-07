function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;
	c.domain[c.id] = c.cache;
	c.expected = {};

	c.key = {};
	c.value = {};
	c.cache.tryAdd = c.mock();
	c.cache.tryAdd.expect(c.key, c.value).return(c.expected);

	c.returned = c.sut.tryAdd(c.key, c.value);
}

module.exports = act;
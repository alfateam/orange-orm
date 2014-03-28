function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;
	c.domain[c.id] = c.cache;

	c.key = {};
	c.value = {};
	c.cache.add = c.mock();
	c.cache.add.expect(c.key, c.value);

	c.returned = c.sut.add(c.key, c.value);
}

module.exports = act;
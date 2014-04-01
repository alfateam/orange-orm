function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;

	c.key = {};
	c.value = {};
	
	c.cache.getAll = {};
	c.cache.tryAdd = c.mock();
	c.cache.tryAdd.expect(c.key, c.value);
	c.newCache.expect().return(c.cache);

	c.returned = c.sut.tryAdd(c.key, c.value);
}

module.exports = act;
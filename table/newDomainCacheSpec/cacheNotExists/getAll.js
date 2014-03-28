function act(c){
	c.expected = {};
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;

	c.cache.getAll = {};
	c.cache.getAll = c.mock();
	c.cache.getAll.expect().return(c.expected);
	c.newCache.expect().return(c.cache);

	c.returned = c.sut.getAll();
}

module.exports = act;
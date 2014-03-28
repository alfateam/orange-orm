function act(c){
	c.cache = {};
	c.id = 'someId'
	c.newId.expect().return(c.id);
	c.domain = {};
	process.domain = c.domain;
	c.domain[c.id] = c.cache;

	c.cache.getAll = c.mock();
	c.expected = {};
	c.cache.getAll.expect().return(c.expected);

	c.returned = c.sut.getAll();
}

module.exports = act;
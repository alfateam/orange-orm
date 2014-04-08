function act(c){
	c.stubCache();
	c.cache.getAll = c.mock();
	c.expected = {};
	c.cache.getAll.expect().return(c.expected);

	c.returned = c.sut.getAll();
}

module.exports = act;
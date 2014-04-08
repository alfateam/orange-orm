function act(c){
	c.cache = {};
	c.newCache.expect().return(c.cache);
	c.domain = {};
	process.domain = c.domain;

	c.returned = c.sut(c.id);
}

module.exports = act;
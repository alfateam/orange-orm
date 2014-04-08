function act(c){
	c.cache = {};
	c.domain = {};
	c.domain[c.id] = c.cache;
	process.domain = c.domain;

	c.returned = c.sut(c.id);
}

module.exports = act;
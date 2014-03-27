function act(c){
	c.domain = {};
	c.manyCache = {};
	c.domain[c.key] = c.manyCache;
	process.domain = c.domain;
	c.cacheChanged(c.cache);
}

module.exports = act;
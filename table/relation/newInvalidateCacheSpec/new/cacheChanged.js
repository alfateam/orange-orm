function act(c){
	c.manyCache = {};

	c.setSessionSingleton.expect(c.key);
	c.cacheChanged(c.cache);
}

module.exports = act;
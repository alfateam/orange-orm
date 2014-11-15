function act(c){
	c.cache = {};
	c.newCache.expect().return(c.cache);

	c.getSessionSingleton.expect(c.id).return();
	c.setSessionSingleton.expect(c.id, c.cache);

	c.returned = c.sut(c.id);
}

module.exports = act;
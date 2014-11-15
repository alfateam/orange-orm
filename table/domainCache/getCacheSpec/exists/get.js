function act(c){
	c.cache = {};

	c.getSessionSingleton.expect(c.id).return(c.cache);

	c.returned = c.sut(c.id);
}

module.exports = act;
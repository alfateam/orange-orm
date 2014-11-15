var parent = {},
	child = {};

function act(c){
	c.cacheCore = {};
	c.cacheCore.tryRemove = c.mock();
	c.cacheCore.tryRemove.expect(parent, child);	
		
	c.getSessionSingleton.expect(c.key).return(c.cacheCore);
	
	c.sut.tryRemove(parent, child);
}

module.exports = act;
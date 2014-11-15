var parent = {},
	child = {};

function act(c){

	c.cacheCore = {};
	c.cacheCore.tryAdd = c.mock();
	c.cacheCore.tryAdd.expect(parent, child);
	
	c.getSessionSingleton.expect(c.key).return(c.cacheCore);

	c.sut.tryRemove = {};
	c.synchronizeChanged.expect(c.sut, c.joinRelation, parent, child);         
	c.sut.tryAdd(parent, child);
}

module.exports = act;
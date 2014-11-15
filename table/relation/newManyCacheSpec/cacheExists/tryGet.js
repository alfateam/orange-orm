var parentRow = {};

function act(c){
	c.expected = {};

	c.cacheCore = {};
	c.cacheCore.tryAdd = c.mock();
	c.cacheCore.tryGet = c.mock();
	c.cacheCore.tryGet.expect(parentRow).return(c.expected);
	
	c.getSessionSingleton.expect(c.key).return(c.cacheCore);

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
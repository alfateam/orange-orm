var parentRow = {};

function act(c){
	c.expected = {};

	c.cacheCore = {};
	c.cacheCore.add = c.mock();
	c.cacheCore.tryGet = c.mock();

	c.newCacheCore.expect(c.joinRelation).return(c.cacheCore);

	c.cacheCore.tryGet.expect(parentRow).return(c.expected);
	
	c.domain = {};
	process.domain = c.domain;
	
	c.newInvalidateCache.expect(c.key, c.joinRelation);

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
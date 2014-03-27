var parentRow = {};

function act(c){
	c.expected = {};

	c.cacheCore = {};
	c.cacheCore.add = c.mock();
	c.cacheCore.tryGet = c.mock();
	c.cacheCore.tryGet.expect(parentRow).return(c.expected);
	
	c.domain = {};
	c.domain[c.key] = c.cacheCore;
	process.domain = c.domain;

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
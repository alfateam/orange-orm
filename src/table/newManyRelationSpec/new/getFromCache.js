var parentRow = {};

function act(c){	
	c.cachedResult = {};
	c.expected = {};
	c.resultToPromise.expect(c.cachedResult).return(c.expected);
	c.cache.tryGet.expect(parentRow).return(c.cachedResult);
	c.returned = c.sut.getFromCache(parentRow);
}
module.exports = act;
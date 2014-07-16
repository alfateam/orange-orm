var parentRow = {};

function act(c){	
	c.cachedResult = {};
	c.resultPromise = {};
	c.resultToPromise.expect(c.cachedResult).return(c.resultPromise);
	c.manyCache.tryGet.expect(parentRow).return(c.cachedResult);
	c.returned = c.sut.getFromCache(parentRow);
}
act.base = '../../new';
module.exports = act;
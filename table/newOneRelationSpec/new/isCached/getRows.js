var parentRow = {};

function act(c){	
	c.cachedResult = {};
	c.expected = {};
	c.resultToPromise.expect(c.cachedResult).return(c.expected);
	c.expanderCache.tryGet.expect(parentRow).return(true);
	c.oneCache.tryGet.expect(parentRow).return(c.cachedResult);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;
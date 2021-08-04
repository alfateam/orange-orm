var parentRow = {};
function act(c){
	c.expected = {};
	c.cacheCore.tryGet.expect([c.cachedValue, c.cachedValue2]).return(c.expected);
	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
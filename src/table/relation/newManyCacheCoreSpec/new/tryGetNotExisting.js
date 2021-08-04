var parentRow = {};
function act(c){
	c.expected = {};
	c.newRowArray.expect(c.childTable).return(c.expected);
	c.cacheCore.tryGet.expect([c.cachedValue, c.cachedValue2]).return(null);
	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
function act(c){
	c.parentRow = {};
	c.existing = {};
	c.row = 'foo';
	c.cachedValue =  {};
	c.cachedValue2 = {};
	c.parentRow[c.alias] = c.cachedValue;
	c.parentRow[c.alias2] = c.cachedValue2;

	c.synchronizeChanged.expect(c.sut.tryAdd, c.joinRelation, c.existing, c.row);

	c.cacheCore.tryGet.expect([c.cachedValue, c.cachedValue2]).return(null);
	c.cacheCore.tryAdd.expect([c.cachedValue, c.cachedValue2], [c.row]).return(c.existing);
	c.sut.tryAdd(c.parentRow, c.row);
}

module.exports = act;
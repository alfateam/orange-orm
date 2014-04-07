function act(c){
	c.existing = {};
	c.parentRow = {};	
	c.row = 'foo';
	c.existing.push = c.mock();
	c.existing.push.expect(c.row);
	c.cachedValue =  {};
	c.cachedValue2 = {};
	c.parentRow[c.alias] = c.cachedValue;
	c.parentRow[c.alias2] = c.cachedValue2;

	c.synchronizeChanged.expect(c.sut.tryAdd, c.joinRelation, c.existing, c.row);

	c.cacheCore.tryGet.expect([c.cachedValue, c.cachedValue2]).return(c.existing);
	c.sut.tryAdd(c.parentRow, c.row);
}

module.exports = act;
function act(c){
	c.row = {};
	c.other = {};
	c.other2 = {};
	c.existing = [c.other, c.row, c.other2];
	c.expected = [c.other, c.other2];
	
	c.parentRow = {};	
	c.cachedValue =  {};
	c.cachedValue2 = {};
	c.parentRow[c.alias] = c.cachedValue;
	c.parentRow[c.alias2] = c.cachedValue2;

	c.cacheCore.tryGet.expect([c.cachedValue, c.cachedValue2]).return(c.existing);
	c.sut.tryRemove(c.parentRow, c.row);
}

module.exports = act;
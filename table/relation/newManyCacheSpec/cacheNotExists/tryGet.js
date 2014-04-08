var parentRow = {};

function act(c){
	c.expected = {};

	c.cacheCore = {};
	c.cacheCore.tryAdd = c.mock();
	c.cacheCore.tryGet = c.mock();

	c.newCacheCore.expect(c.joinRelation).return(c.cacheCore);

	c.cacheCore.tryGet.expect(parentRow).return(c.expected);
	
	c.domain = {};
	process.domain = c.domain;
	
	c.childTable = {};
	c.childTableCache = {};
	c.childTableCache.getAll = c.mock();

	c.childRow1 = {};
	c.childRow2 = {};
	c.childRow3 = {};

	c.fakeParent1 = {};
	c.fakeParent2 = {};
	c.fakeParent3 = {};

	
	c.childTableCache.getAll.expect().return([c.childRow1, c.childRow2, c.childRow3]);
	c.childTable._cache = c.childTableCache;
	c.joinRelation.childTable = c.childTable;

	c.cacheCore.tryGet.expect(c.fakeParent1).return(null);

	c.extractParentKey.expect(c.joinRelation, c.childRow1).return(c.fakeParent1);
	c.extractParentKey.expect(c.joinRelation, c.childRow2).return(c.fakeParent2);
	c.extractParentKey.expect(c.joinRelation, c.childRow3).return(c.fakeParent3);

	c.sut.tryAdd = c.mock();	
	c.sut.tryAdd.expect(c.fakeParent1, c.childRow1);
	c.sut.tryAdd.expect(c.fakeParent2, c.childRow2);
	c.sut.tryAdd.expect(c.fakeParent3, c.childRow3);
	
	c.sut.tryRemove = {};

	c.synchronizeAdded.expect(c.sut.tryAdd, c.joinRelation);
	c.synchronizeRemoved.expect(c.sut.tryRemove, c.joinRelation);

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
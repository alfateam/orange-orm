var parentRow = {};

function act(c){
	c.expected = {};

	c.cacheCore = {};
	c.cacheCore.add = c.mock();
	c.cacheCore.tryGet = c.mock();

	c.newCacheCore.expect(c.joinRelation).return(c.cacheCore);

	c.cacheCore.tryGet.expect(parentRow).return(c.expected);
	
	c.domain = {};
	process.domain = c.domain;
	
	c.newInvalidateCache.expect(c.key, c.joinRelation);
	c.childTable = {};
	c.childTableCache = {};
	c.childTableCache.getAll = c.mock();

	c.parentPkValue11 = 13; 
	c.parentPkValue12 = 'a';

	c.parentPkValue21 = 77; 
	c.parentPkValue22 = 'b';

	c.childRow1 = {};
	c.childRow2 = {};
	c.childRow3 = {};

	c.childRow1.parentPk1 = c.parentPkValue11; 
	c.childRow1.parentPk2 = c.parentPkValue12; 
	c.childRow1.other = 'foo';
	
	c.childRow2.parentPk1 = c.parentPkValue21; 
	c.childRow2.parentPk2 = c.parentPkValue22; 
	c.childRow2.other = 'bar';
	
	c.childRow3.parentPk1 = c.parentPkValue11; 
	c.childRow3.parentPk2 = c.parentPkValue12; 
	c.childRow3.other = 'baz';

	c.primaryColumn1 = {};
	c.primaryColumn1.alias = 'pk1Alias';
	c.primaryColumn2 = {};
	c.primaryColumn2.alias = 'pk2Alias';	
	c.childTable._primaryColumns = [c.primaryColumn1, c.primaryColumn2];

	c.joinedColumn1 = {};
	c.joinedColumn1.alias = 'parentPk1';
	c.joinedColumn2 = {};
	c.joinedColumn2.alias = 'parentPk2';

	c.joinRelation.columns = [c.joinedColumn1, c.joinedColumn2];

	c.fakeParent1 = {};
	c.fakeParent1.pk1Alias = c.parentPkValue11;
	c.fakeParent1.pk2Alias = c.parentPkValue12;

	c.fakeParent2 = {};
	c.fakeParent2.pk1Alias = c.parentPkValue21;
	c.fakeParent2.pk2Alias = c.parentPkValue22;

	
	c.childTableCache.getAll.expect().return([c.childRow1, c.childRow2, c.childRow3]);
	c.childTable._cache = c.childTableCache;
	c.joinRelation.childTable = c.childTable;

	c.cacheCore.tryGet.expect(c.fakeParent1).return(null);
	c.cacheCore.add.expect(c.fakeParent1, c.childRow1);
	c.cacheCore.add.expect(c.fakeParent2, c.childRow2);
	c.cacheCore.add.expect(c.fakeParent1, c.childRow3);

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;
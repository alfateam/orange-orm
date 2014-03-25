var parentRow = {};

function act(c){	
	c.result = {};

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.childTable.getManySync = c.mock();
	c.childTable.getManySync.expect(c.foreignKeyFilter).return(c.result);

	c.manyCache.tryGet.expect(parentRow).return(null);
	c.manyCache.add = c.mock();
	c.manyCache.add.expect(parentRow, c.result);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;
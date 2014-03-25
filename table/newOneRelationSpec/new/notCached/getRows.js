var parentRow = {};

function act(c){	
	c.result = {};

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.childTable.tryGetFirstSync = c.mock();
	c.childTable.tryGetFirstSync.expect(c.foreignKeyFilter).return(c.result);

	c.oneCache.tryGet.expect(parentRow).return(null);
	c.oneCache.add = c.mock();
	c.oneCache.add.expect(parentRow, c.result);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;
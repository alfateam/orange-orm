var parentRow = {};

function act(c){	
	c.result = 'res';

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.expected = {};
	c.childTable.tryGetFirst = c.mock();
	c.childTable.tryGetFirst.expect(c.foreignKeyFilter).return(c.expected);

	c.returned = c.sut.getFromDb(parentRow);
}
module.exports = act;
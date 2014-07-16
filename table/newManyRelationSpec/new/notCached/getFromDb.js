var parentRow = {};

function act(c){	
	c.expected = {};

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.childTable.getMany = c.mock();
	c.childTable.getMany.expect(c.foreignKeyFilter).return(c.expected);

	c.returned = c.sut.getFromDb(parentRow);
}
act.base = '../../new';
module.exports = act;
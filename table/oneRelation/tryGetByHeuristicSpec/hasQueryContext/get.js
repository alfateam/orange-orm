function act(c) {
	c.row = {};
	c.row2 = {};
	c.rows = [c.row, c.row2];
	c.rowsPromise = c.then();
	c.rowsPromise(c.rows);

	c.queryContext = {};
	c.parentRow.queryContext = c.queryContext;
	c.childTable = {};
	c.relation.childTable = c.childTable;
	
	c.childTable.getMany = c.mock();
	c.filter = {};
	c.childTable.getMany.expect(c.filter).return(c.rowsPromise);
	
	c.newFarRelativesFilter.expect(c.relation, c.queryContext).return(c.filter);

	c.relation.joinRelation = c.joinRelation;
	c.extractParentKey.expect(c.joinRelation, c.row).return(c.parent);
	c.extractParentKey.expect(c.joinRelation, c.row2).return(c.parent2);

	c.relation.expand = c.mock();
	c.relation.expand.expect(c.parent);
	c.relation.expand.expect(c.parent2);

	c.sut(c.parentRow, c.relation).then(null,null);
}

module.exports = act;
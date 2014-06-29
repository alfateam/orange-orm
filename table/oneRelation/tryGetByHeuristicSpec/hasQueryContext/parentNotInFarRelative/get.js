function act(c) {
	c.row = {};
	c.row2 = {};
	c.rows = [c.row, c.row2];
	c.rowsPromise = c.then();
	c.rowsPromise(c.rows);

	c.queryContext = {};
	c.parentRow.queryContext = c.queryContext;
	
	c.getFarRelatives.expect(c.parentRow, c.relation).return(c.rowsPromise);



	c.joinRelation = {};

	c.parent = {};
	c.parent2 = {};
	c.parentPromise = c.then();
	c.parentPromise2 = c.then();
	c.parentPromise.resolve(c.parent);
	c.parentPromise2.resolve(c.parent2);

	c.joinRelation.getRows = c.mock();
	c.joinRelation.getRows.expect(c.row).return(c.parentPromise);
	c.joinRelation.getRows.expect(c.row2).return(c.parentPromise2);
	c.relation.joinRelation = c.joinRelation;

	c.relation.expand = c.mock();
	c.relation.expand.expect(c.parent);
	c.relation.expand.expect(c.parent2);

	c.sut(c.parentRow, c.relation).then(onOk,c.mock());

	function onOk(returned) {
		c.returned = returned;
	}
}

module.exports = act;
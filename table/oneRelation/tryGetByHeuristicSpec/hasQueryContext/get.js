function act(c) {
	c.expected = {};
	c.queryContext = {};
	c.parentRow.queryContext = c.queryContext;
	
	c.queryContext.getFarRelatives = c.mock();
	c.queryContext.getFarRelatives.expect(c.parentRow, c.relation, c.getFarRelatives).return(c.expected);

	c.returned = c.sut(c.parentRow, c.relation);

}

module.exports = act;
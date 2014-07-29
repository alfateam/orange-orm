function act(c) {
	c.expected = {};
	c.queryContext = {};
	c.parentRow.queryContext = c.queryContext;

	c.rightAlias = {};
	c.joinRelation = {};
	c.joinRelation.rightAlias = c.rightAlias;
	
	c.relation.joinRelation = c.joinRelation;
	
	c.queryContext.getFarRelatives = c.mock();
	c.queryContext.getFarRelatives.expect(c.rightAlias, c.parentRow, c.relation, c.getFarRelatives).return(c.expected);

	c.returned = c.sut(c.parentRow, c.relation);

}

module.exports = act;
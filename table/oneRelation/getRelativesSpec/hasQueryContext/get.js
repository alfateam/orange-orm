function act(c) {
	c.expected = {};
	c.queryContext = {};
	c.parentRow.queryContext = c.queryContext;

	c.rightAlias = {};
	c.joinRelation = {};
	c.joinRelation.rightAlias = c.rightAlias;
	
	c.relation.joinRelation = c.joinRelation;
	
	c.queryContext.getRelatives = c.mock();
	c.queryContext.getRelatives.expect(c.rightAlias, c.parentRow, c.relation, c.getRelatives).return(c.expected);

	c.returned = c.sut(c.parentRow, c.relation);

}

module.exports = act;
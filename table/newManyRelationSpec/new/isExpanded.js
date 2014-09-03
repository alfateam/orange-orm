function act(c) {
	c.expected = {};
	c.parentRow = {};
	c.parentRow.isExpanded = c.mock();
	c.alias = {};
	c.joinRelation.rightAlias = c.alias;
	c.parentRow.isExpanded.expect(c.alias).return(c.expected);
	c.returned = c.sut.isExpanded(c.parentRow);
} 

module.exports = act;
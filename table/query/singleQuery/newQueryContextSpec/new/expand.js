function act(c){
	c.row = {};
	c.row2 = {};

	c.alias = {};
	c.relation = {};
	c.relation.leftAlias = c.alias;

	c.relation.expand = c.mock();
	c.relation.expand.expect(c.row);
	c.relation.expand.expect(c.row2);

	c.sut.expand(c.relation);
}

module.exports = act;
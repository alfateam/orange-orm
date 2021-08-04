function act(c){
	c.relation = {};

	c.relation.expand = c.mock();
	c.relation.expand.expect(c.row);
	c.relation.expand.expect(c.row2);

	c.sut.expand(c.relation);
}

module.exports = act;
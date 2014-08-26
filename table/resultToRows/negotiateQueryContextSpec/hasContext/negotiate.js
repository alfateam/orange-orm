function act(c){
	c.queryContext = {};
	c.queryContext.add = c.mock();
	c.queryContext.add.expect(c.row);

	c.sut(c.queryContext, c.row);
}

module.exports = act;
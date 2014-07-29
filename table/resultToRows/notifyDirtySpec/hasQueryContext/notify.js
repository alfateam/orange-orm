function act(c){
	c.queryContext = {};
	c.row.queryContext = c.queryContext;
	c.queryContext.dirty = c.mock();
	c.queryContext.dirty.expect(c.row);
		
	c.sut(c.row);
}

module.exports = act;
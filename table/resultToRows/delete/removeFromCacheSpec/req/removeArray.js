function act(c){

	c.strategy = {};
	c.row1 = {};
	c.row2 = {};
	c.rows = [c.row1, c.row2];

	c.nextRemoveFromCache = c.requireMock('./removeFromCache');
	c.nextRemoveFromCache.expect(c.row1, c.strategy, c.table);	
	c.nextRemoveFromCache.expect(c.row2, c.strategy, c.table);	

	c.sut(c.rows, c.strategy, c.table);
}

module.exports = act;
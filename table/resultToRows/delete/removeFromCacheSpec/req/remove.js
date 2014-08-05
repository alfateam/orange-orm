function act(c){
	c.fooStrategy = {};
	c.barStrategy = {};
	c.strategy = {foo: c.fooStrategy, bar: c.barStrategy};	
	c.fooRows = {};

	c.fooRelation.isExpanded = c.mock();
	c.fooRelation.isExpanded.expect(c.row).return(true);

	c.barRelation.isExpanded = c.mock();
	c.barRelation.isExpanded.expect(c.row).return(false);
	
	c.nextRemoveFromCache = c.requireMock('./removeFromCache');
	c.nextRemoveFromCache.expect(c.fooRows, c.fooStrategy, c.fooTable);	

	c.fooRelation.getRowsSync = c.mock();
	c.fooRelation.getRowsSync.expect(c.row).return(c.fooRows);
	
	c.cache = {};
	c.table._cache = c.cache;

	c.cache.tryRemove = c.mock();
	c.cache.tryRemove.expect(c.row);
		
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
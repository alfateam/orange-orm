function act(c){
	c.fooStrategy = {};
	c.barStrategy = {};
	c.strategy = {foo: c.fooStrategy, bar: c.barStrategy};	
	c.fooRows = {};
	c.barRows = {};
	
	c.nextRemoveFromCache = c.requireMock('./removeFromCache');
	c.nextRemoveFromCache.expect(c.fooRows, c.fooStrategy, c.fooTable);	
	c.nextRemoveFromCache.expect(c.barRows, c.barStrategy, c.barTable);	

	c.fooRelation.getRowsSync = c.mock();
	c.fooRelation.getRowsSync.expect(c.row).return(c.fooRows);

	c.barRelation.getRowsSync = c.mock();
	c.barRelation.getRowsSync.expect(c.row).return(c.barRows);
	
	c.cache = {};
	c.table._cache = c.cache;

	c.cache.tryRemove = c.mock();
	c.cache.tryRemove.expect(c.row);
		
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
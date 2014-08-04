function act(c){
	c.row = {};
	c.strategy = {};
	c.table = {};

	c.cache = {};
	c.table._cache = c.cache;

	c.cache.tryRemove = c.mock();
	c.cache.tryRemove.expect(c.row);
	
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
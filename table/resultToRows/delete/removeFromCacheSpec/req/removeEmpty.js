function act(c){
	c.fooStrategy = {};
	c.barStrategy = {};
	c.strategy = {foo: c.fooStrategy, bar: c.barStrategy};	
		
	c.sut(undefined, c.strategy, c.table);
}

module.exports = act;
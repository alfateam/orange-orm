function act(c){	
	c.strategy = {};

	c.extractDeleteStrategy.expect(c.initialStrategy, c.table).return(c.strategy);
	c.delete.expect(c.sut, c.strategy, c.table);
	
	c.sut.delete(c.initialStrategy);

}

module.exports = act;
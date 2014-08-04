function act(c){	

	c.newCascadeDeleteStrategy.expect(c.table).return(c.cascadeDeleteStrategy);

	c.delete.expect(c.sut, c.cascadeDeleteStrategy, c.table);	
	c.sut.cascadeDelete(c.initialStrategy);
}

module.exports = act;
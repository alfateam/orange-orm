function act(c){	
	c.empty = {};
	c.newObject.expect().return(c.empty)
	c.newCascadeDeleteStrategy.expect(c.empty, c.table).return(c.cascadeDeleteStrategy);

	c.delete.expect(c.sut, c.cascadeDeleteStrategy, c.table);	
	c.sut.cascadeDelete(c.initialStrategy);
}

module.exports = act;
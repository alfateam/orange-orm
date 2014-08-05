function act(c){
	c.row = {};
	c.strategy = {};
	c.table = {};
	c.command = {};
	c.changeSet = {};

	c.removeFromCache.expect(c.row, c.strategy, c.table);
	c.newDeleteCommand.expect([],c.row, c.strategy, c.table).return(c.command);
	
	c.pushCommand.expect(c.command);
				
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
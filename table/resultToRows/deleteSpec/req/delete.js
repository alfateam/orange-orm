function act(c){
	c.row = {};
	c.strategy = {};
	c.table = {};
	c.command = {};
	c.changeSet = {};
	c.span = {};
	c.filter = {};
	c.primary1 = {};
	c.primary2 = {};
	c.id1 = {};
	c.id2 = {};

	c.removeFromCache.expect(c.row, c.strategy, c.table);

	c.primary1.alias = 'p1';	
	c.primary2.alias = 'p2';

	c.row.p1 = c.id1;
	c.row.p2 = c.id2;

	c.primaryColumns = [c.primary1, c.primary2];
	c.table._primaryColumns = c.primaryColumns;

	c.newPrimaryKeyFilter.expect(c.table, c.id1, c.id2).return(c.filter);

	c.strategyToSpan.expect(c.strategy).return(c.span);	

	c.newDeleteCommand.expect([],c.table, c.filter, c.span, c.alias, c.innerJoin).return(c.command);	
	
	c.pushCommand.expect(c.command);
				
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
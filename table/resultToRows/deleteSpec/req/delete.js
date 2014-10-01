function act(c){
	c.row = {};
	c.strategy = {};
	c.table = {};
	c.command = {};
	c.command2 = {};
	c.commands = [c.command, c.command2];

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

	c.relations = [];

	c.newDeleteCommand.expect([],c.table, c.filter, c.strategy, c.alias, c.relations).return(c.commands);	
	
	c.pushCommand.expect(c.command);
	c.pushCommand.expect(c.command2);
				
	c.sut(c.row, c.strategy, c.table);
}

module.exports = act;
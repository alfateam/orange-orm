function act(c){
	c.table = {};
	c.initialStrategy = {};
	c.initialFilter = {};
	c.filter = {};
	c.strategy = {};
	c.command = {};
	c.command2 = {};
	c.commands = [c.command, c.command2];

	c.relations = [];
	c.initialCmds = [];

	c.negotiateRawSqlFilter.expect(c.initialFilter).return(c.filter);

	c.newDeleteCommand.expect(c.initialCmds, c.table, c.filter, c.strategy, c.relations).return(c.commands);	

	c.extractDeleteStrategy.expect(c.initialStrategy).return(c.strategy);
	
	c.pushCommand.expect(c.command);
	c.pushCommand.expect(c.command2);
				
	c.returned = c.sut(c.table, c.initialFilter, c.initialStrategy);
}

module.exports = act;
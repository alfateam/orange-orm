function act(c){
	c.lastCommandMatches.expect(c.row).return(false);
	c.updateCommand = {};
	c.newUpdateCommand.expect(c.table, c.column, c.row).return(c.updateCommand);

	c.pushCommand.expect(c.updateCommand, c.row);

	c.sut(c.table, c.column, c.row);
}

module.exports = act;
function act(c){
	c.sql = {};
	c.parameters = {};
	c.insertCommand = {};
	c.insertCommand.sql = c.mock();
	c.insertCommand.sql.expect().return(c.sql);
	c.insertCommand.parameters = c.parameters;
	c.newInsertCommandCore.expect(c.table, c.row).return(c.insertCommand);
	c.returned = c.sut.sql();
}

module.exports = act;
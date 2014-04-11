var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newUpdateCommand = requireMock('./commands/newUpdateCommand');
	c.pushCommand = requireMock('./commands/pushCommand');

	c.updateCommand = {};
	c.newUpdateCommand.expect(c.table, c.column, c.row).return(c.updateCommand);

	c.pushCommand.expect(c.updateCommand, c.row);

	require('../updateField')(c.table, c.column, c.row);
}

module.exports = act;
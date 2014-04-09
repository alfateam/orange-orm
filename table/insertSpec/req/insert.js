var a = require('a');
var requireMock = a.requireMock;

function act(c){
	c.initialRow = {};
	c.insertCommand = {};
	c.row = {};

	c.cache.tryAdd = c.mock();
	c.cache.tryAdd.expect(c.initialRow).return(c.row);

	c.newRow.expect(c.table, c.id, c.id2).return(c.initialRow);
	c.newInsertCommand.expect(c.row).return(c.insertCommand);
	c.pushCommand.expect(c.insertCommand);

	c.returned = c.sut(c.table, c.id, c.id2);
}

module.exports = act;
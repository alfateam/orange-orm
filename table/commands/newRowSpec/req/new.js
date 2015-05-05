var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.decodeDbRow.expect(c.table, c.table, c.rowDto).return(c.row);

	c.returned = c.sut(c.table, c.id, c.id2);
}

module.exports = act;
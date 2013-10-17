var requireMock = require('a').requireMock;
var primaryColumnName = {};
var columnDef = {};

function act(c) {
	c.expected = {};
	c.columnDef = columnDef;
	c.newColumn.expect(c.sut,primaryColumnName).return(columnDef);	
	c.column.expect(columnDef).return(c.expected);
	c.returned = c.sut.primaryColumn(primaryColumnName);
}

act.base = '../new';
module.exports = act;
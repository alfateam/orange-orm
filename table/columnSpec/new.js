var requireMock = require('a_mock').requireMock;
newColumn = requireMock('./column/newColumn');
var newSut = require('../column');
var columnName = 'columnName';
var table = {};
var column = {};

function act(c) {
	c.table = table;
	c.column = column;
	newColumn.expect(table,columnName).return(column);
	c.sut = newSut(table,columnName);
}

module.exports = act;
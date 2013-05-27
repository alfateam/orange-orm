var table = {};
var columnName = 'columnName';
var requireMock = require('a_mock').requireMock;
var newColumn = requireMock('./column/newColumn');
var column = {};
var columns = [];
var newSut = require('../column');

function act(c) {
	table.columns = columns;	
	newColumn.expect(columnName).return(column);
	c.columns = columns;
	c.column = column;
	c.table = table;
	c.sut = newSut(table,columnName);
}

module.exports = act;
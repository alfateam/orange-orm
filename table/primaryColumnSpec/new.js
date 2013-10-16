var table = {};
var columnName = 'columnName';
var requireMock = require('a').requireMock;
var newColumn = requireMock('./column');
var column = {};
var columns = [];
var primaryColumns = [];
var newSut = require('../primaryColumn');

function act(c) {
	table._columns = columns;	
	table._primaryColumns = primaryColumns;
	newColumn.expect(table,columnName).return(column);
	c.columns = columns;
	c._primaryColumns = primaryColumns;
	c.column = column;
	c.table = table;
	c.sut = newSut(table,columnName);
}

module.exports = act;
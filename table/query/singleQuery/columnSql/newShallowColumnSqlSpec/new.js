var columnName = 'a';
var column = {};
column.name = columnName;

var columnName2 = 'b';
var column2 = {};
column2.name = columnName2;

var columns = [column,column2];
var table = {};
table.columns = columns;
var alias = '_0';

function act(c) {
	c.returned = require('../newShallowColumnSql')(table,alias);
	c.expected = '_0.a,_0.b';
}

module.exports = act;
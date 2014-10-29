var columnName = 'a';
var column = {};
column._dbName = columnName;

var columnName2 = 'b';
var column2 = {};
column2._dbName = columnName2;

var columns = [column,column2];
var table = {};
table._columns = columns;
var alias = '_0';

function act(c) {
	c.returned = require('../newShallowColumnSql')(table,alias);
	c.expected = '_0.a as s_00,_0.b as s_01';
}

module.exports = act;
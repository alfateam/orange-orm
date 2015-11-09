var columnName = 'a';
var column = {};
column._dbName = columnName;
column.alias = 'fooProp';

var columnName2 = 'b';
var column2 = {};
column2._dbName = columnName2;
column2.alias = 'barProp';

var columns = [column,column2];
var table = {};
table._columns = columns;
var alias = '_0';

function act(c) {
	c.returned = require('../newShallowColumnSql')(table,alias);
	c.expected = '_0.a as "fooProp",_0.b as "barProp"';
}

module.exports = act;
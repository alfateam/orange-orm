var columnName = 'a';
var column = {};
column._dbName = columnName;
column.alias = 'fooProp';

var columnName2 = 'b';
var column2 = {};
column2._dbName = columnName2;
column2.alias = 'barProp';

var columnName3 = 'c';
var column3 = {};
column3._dbName = columnName3;
column3.serializable = false;
column3.serializable = false;
column3.alias = 'ignoreProp';

var columns = [column,column2,column3];
var table = {};
table._columns = columns;
var alias = '_0';

function act(c) {
	c.returned = require('../newShallowColumnSql')(table,alias);
	c.expected = '_0.a as "fooProp",_0.b as "barProp"';
}

module.exports = act;
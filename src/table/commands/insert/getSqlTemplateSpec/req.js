var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.table = {};
	c.tableName = 'theTable';
	c.table._dbName = c.tableName;

	c.column1 = {};
	c.columnName1 = 'colName1';
	c.column1._dbName = c.columnName1;

	c.column2 = {};
	c.columnName2 = 'colName2';
	c.column2._dbName = c.columnName2;

	c.table._columns = [c.column1, c.column2];
	c.colDiscriminator1 = "fooColumn='fooDiscr'";
	c.colDiscriminator2 = "barColumn='barDiscr'";
	c.table._columnDiscriminators = [c.colDiscriminator1, c.colDiscriminator2];

	c.sut = require('../getSqlTemplate');
}

module.exports = act;
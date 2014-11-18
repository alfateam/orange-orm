var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.shallowDbRowToRow = requireMock('../resultToRows/shallowDbRowToRow');

	c.row = {};
	c.mock = mock;	
	c.table = {};

	c.id = 1;
	c.primaryColumn = {};
	c.primaryColumn.alias = 'pkAlias';	

	c.id2 = 'two';
	c.primaryColumn2 = {};
	c.primaryColumn2.alias = 'pkAlias2';	

	c.primaryColumns = [c.primaryColumn, c.primaryColumn2];
	c.table._primaryColumns = c.primaryColumns;

	c.column = {};
	c.column.alias = 'alias';	
	c.defaultValue = 'def';	
	c.column.default = c.defaultValue;
	
	c.column2 = {};
	c.column2.alias = 'alias2';	

	c.columns = [c.column, c.primaryColumn, c.column2, c.primaryColumn2];
	c.table._columns = c.columns;

	c.rowDto = {};
	c.rowDto.alias = c.defaultValue;
	c.rowDto.alias2 = null;
	c.rowDto.pkAlias = c.id;
	c.rowDto.pkAlias2 = c.id2;

	c.shallowDbRowToRow.expect(c.table, c.rowDto).return(c.row);

	c.returned = require('../newRow')(c.table, c.id, c.id2);
}

module.exports = act;
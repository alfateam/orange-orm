var when = require('a').when;
var c = {};

when(c)
	.it('should set column on ColumnList with alias').assertEqual(c.column, c.columnList[c.alias])
	;

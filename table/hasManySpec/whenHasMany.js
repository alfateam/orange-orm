var when = require('a').when;
var c = {};

when(c)
	.it('should set table.alias to getRelatedTable').assertEqual(c.getRelatedTable,c.parentTable.child);
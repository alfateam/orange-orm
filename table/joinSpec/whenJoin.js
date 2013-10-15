var when = require('a').when;
var c = {};

when(c)
	.it('should return joinRelation').assertEqual(c.joinRelation,c.returned)
	.it('should set table.alias to getRelatedTable').assertEqual(c.getRelatedTable,c.parentTable.child);
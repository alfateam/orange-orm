var when = require('a').when;
var c = {};

when(c).
	it('should add oneRelation to relations').assertEqual(c.oneRelation,c.parentTable._relations['child']).
	it('should set table.alias to getRelatedTable').assertEqual(c.getRelatedTable,c.parentTable.child);
var when = require('a').when;
var c = {};

when(c).
	it('should have joinRelation').assertEqual(c.joinRelation, c.sut.joinRelation).
	it('should set childTable').assertEqual(c.childTable,c.sut.childTable)
	.it('should set expand to expanderCache.add').assertStrictEqual(c.expanderCache.add, c.sut.expand);;
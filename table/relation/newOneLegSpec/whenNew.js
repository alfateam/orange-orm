var when = require('a').when;
var c = {};

when(c)
	.it('should set table to childTable').assertEqual(c.childTable,c.sut.table)
	.it('should set span.table to parentTable').assertEqual(c.parentTable,c.sut.span.table)
	.it('should set columns').assertEqual(c.columns,c.sut.columns)
	.it('span.legs should should be empty collection').assertEqual(c.emptyCollection,c.sut.span.legs)
	.it('should set expand method').assertEqual(c.relation.expand, c.sut.expand)
	.it('should set name').assertEqual(c.joinRelation.rightAlias, c.sut.name)
	
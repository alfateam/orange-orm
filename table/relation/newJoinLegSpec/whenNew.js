var when = require('a').when;
var c = {};

when(c)
	.it('should set table to parentTable').assertEqual(c.parentTable,c.sut.table)
	.it('should set span.table to childTable').assertEqual(c.childTable,c.sut.span.table)
	.it('should set columns').assertEqual(c.columns,c.sut.columns)
	.it('span.legs should should be empty collection').assertEqual(c.emptyCollection,c.sut.span.legs)
	.it('should set expand').assertEqual(c.relation.expand, c.sut.expand)
	.it('should set name').assertEqual(c.relation.leftAlias, c.sut.name)
	
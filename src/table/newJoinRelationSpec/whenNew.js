var when = require('a').when;
var c = {};

when(c)
	.it('should have two columns').assertEqual(2,c.sut.columns.length)
	.it('should have fooColumn').assertEqual(c.fooColumn,c.sut.columns[0])
	.it('should have barColumn').assertEqual(c.barColumn,c.sut.columns[1])
	.it('should have parentTable').assertEqual(c.parentTable,c.sut.parentTable)
	.it('should have childTable').assertEqual(c.childTable,c.sut.childTable)
	.it('should set getFromCache to getFromDb').assertEqual(c.sut.getFromDb, c.sut.getFromCache)
	

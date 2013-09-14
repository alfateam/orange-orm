var when = require('a').when;
var c = {};

when('./new',c)
	.it('should add column to table.primaryColumns').assertEqual(c.column,c.primaryColumns[0])
	.it('should not add any other to table.primaryColumns').assertEqual(1,c.primaryColumns.length)
	.it('should not add to table.columns').assertEqual(0,c.columns.length)
	.it('should return column').assertEqual(c.column,c.sut);
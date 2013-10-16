var when = require('a').when;
var c = {};

when('./new',c)
	.it('should add column to table._primaryColumns').assertEqual(c.column,c._primaryColumns[0])
	.it('should not add any other to table._primaryColumns').assertEqual(1,c._primaryColumns.length)
	.it('should not add to table._columns').assertEqual(0,c.columns.length)
	.it('should return column').assertEqual(c.column,c.sut);
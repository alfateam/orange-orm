var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should add column to table.columns').assertEqual(c.column,c.columns[0])
	.it('should not add any other columns').assertEqual(1,c.columns.length)
	.it('should return column').assertEqual(c.column,c.sut);
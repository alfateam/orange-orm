var when = require('a').when;
var c = {};

when(c)
	.it('should return for update').assertEqual(' FOR UPDATE', c.sut(c.tableWithExclusive))
	.it('should return empty').assertEqual('', c.sut(c.table))

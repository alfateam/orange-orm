var when = require('a').when;
var c = {};

when(c)
	.it('should return for update when on table').assertEqual(c.expected, c.sut(c.tableWithExclusive, 'alias'))
	.it('should return for update when parameter').assertEqual(c.expected, c.sut(c.table, 'alias', true))
	.it('should return empty').assertEqual('', c.sut(c.table))

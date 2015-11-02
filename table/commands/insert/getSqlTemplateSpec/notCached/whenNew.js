var when = require('a').when;
var c = {};

when(c)
	.it('should return insertCommand').assertEqual(c.expected, c.returned)
	.it('should set insertCommand on table').assertEqual(c.expected, c.table._insertTemplate)
	
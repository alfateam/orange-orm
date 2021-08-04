var when = require('a').when;
var c = {};

when(c)
	.it('should forward to delete with cascade strategy').assertEqual(c.expected, c.returned)

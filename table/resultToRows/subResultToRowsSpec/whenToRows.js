var when = require('a').when;
var c = {};

when(c)
	.it('should create rows for all legs').assertEqual(c.expected, c.returned)

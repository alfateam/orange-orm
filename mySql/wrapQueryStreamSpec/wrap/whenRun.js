var when = require('a').when;
var c = {};

when(c)
	.it('should execute query and return value').assertEqual(c.expected, c.returned)

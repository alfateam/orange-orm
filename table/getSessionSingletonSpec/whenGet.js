var when = require('a').when;
var c = {};

when(c)
	.it('should return singleton').assertEqual(c.expected, c.returned)

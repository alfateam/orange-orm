var when = require('a').when;
var c = {};

when(c)
	.it('should return empty array').assertEqual(c.expected, c.returned)
	;

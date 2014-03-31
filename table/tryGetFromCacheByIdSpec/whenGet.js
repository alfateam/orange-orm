var when = require('a').when;
var c = {};

when(c)
	.it('should return cached item').assertEqual(c.expected, c.returned)
	;

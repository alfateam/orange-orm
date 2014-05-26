
var when = require('a').when;
var c = {};

when(c)
	.it('should return cached result').assertEqual(c.expected, c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return result').assertEqual(c.expected, c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return cached result from original func').assertEqual(c.expected, c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return from cacheCore').assertEqual(c.expected, c.returned)
	;

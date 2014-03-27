var when = require('a').when;
var c = {};

when(c)
	.it('should return result from cacheCore').assertEqual(c.expected, c.returned)
	;

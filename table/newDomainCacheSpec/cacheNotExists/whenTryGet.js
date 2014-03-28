var when = require('a').when;
var c = {};

when(c)
	.it('should return from cache').assertEqual(c.expected, c.returned)
	.it('should set cache on domain').assertEqual(c.domain[c.id], c.cache)	
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should add to cache').assertDoesNotThrow(c.cache.tryAdd.verify)
	.it('should return cached').assertEqual(c.expected, c.returned)
	
	;

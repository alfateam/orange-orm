var when = require('a').when;
var c = {};

when(c)
	.it('should add to cache').assertDoesNotThrow(c.cache.add.verify)
	.it('should set cache on domain').assertEqual(c.domain[c.id], c.cache)
	;

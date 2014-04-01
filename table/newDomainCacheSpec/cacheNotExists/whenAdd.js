var when = require('a').when;
var c = {};

when(c)
	.it('should tryAdd to cache').assertDoesNotThrow(c.cache.tryAdd.verify)
	.it('should set cache on domain').assertEqual(c.domain[c.id], c.cache)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should forward to CacheCore').assertDoesNotThrow(c.cacheCore.add.verify)
	;

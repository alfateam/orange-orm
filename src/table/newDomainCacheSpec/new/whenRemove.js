var when = require('a').when;
var c = {};

when(c)
	.it('should remove from cache').assertDoesNotThrow(c.cache.tryRemove.verify)
	
	;

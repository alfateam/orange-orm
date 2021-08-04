var when = require('a').when;
var c = {};

when(c)
	.it('should forward to CacheCore').assertDoesNotThrow(c.cacheCore.tryAdd.verify)
	.it('should add row to rows').assertDoesNotThrow(c.rows.push.verify)	
	;

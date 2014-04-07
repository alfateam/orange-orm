var when = require('a').when;
var c = {};

when(c)
	.it('should forward to CacheCore').assertDoesNotThrow(c.cacheCore.tryAdd.verify)
	.it('should synchronize changed').assertDoesNotThrow(c.synchronizeChanged.verify)
	;

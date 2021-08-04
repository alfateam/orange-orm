var when = require('a').when;
var c = {};

when(c)
	.it('should remove from cacheCore').assertDoesNotThrow(c.cacheCore.tryRemove.verify)
	;

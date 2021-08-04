var when = require('a').when;
var c = {};

when(c)
	.it('should add to cacheCore').assertDoesNotThrow(c.cacheCore.tryAdd.verify)
	.it('should create synchronizeChanged').assertDoesNotThrow(c.synchronizeChanged.verify)
	
	;

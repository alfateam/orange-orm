var when = require('a').when;
var c = {};

when(c)
	.it('should remove from domainCache').assertDoesNotThrow(c.domainCache.tryRemove.verify)
	;

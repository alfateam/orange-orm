var when = require('a').when;
var c = {};

when(c)
	.it('should add to domainCache').assertDoesNotThrow(c.domainCache.add.verify)
	;

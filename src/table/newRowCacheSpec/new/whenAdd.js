var when = require('a').when;
var c = {};

when(c)
	.it('should add to domainCache').assertDoesNotThrow(c.domainCache.tryAdd.verify)
	.it('should return row').assertEqual(c.expected, c.returned)	
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should expand relation').assertDoesNotThrow(c.queryContext.expand.verify)
	.it('should negotiate expand inverse').assertDoesNotThrow(c.negotiateExpandInverse.verify)	
	.it('returns rows').assertEqual(c.rows, c.returned)
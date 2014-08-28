var when = require('a').when;
var c = {};

when(c)
	.it('should expand relation').assertDoesNotThrow(c.queryContext.expand.verify)
	.it('returns rows').assertEqual(c.rows, c.returned)
;
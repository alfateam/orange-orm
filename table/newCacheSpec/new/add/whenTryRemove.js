var when = require('a').when;
var c = {};

when(c)
	.it('should return cached result').assertEqual(c.result, c.returned)
	.it('should emit removed').assertDoesNotThrow(c.emitRemoved.verify)
	
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return value').assertEqual(c.result, c.returned)
	.it('should emit added').assertDoesNotThrow(c.emitAdded.verify)	
	;

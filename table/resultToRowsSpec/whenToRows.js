var when = require('a').when;
var c = {};

when(c)
	.it('should create rows').assertDoesNotThrow(c.dbRowsToRows.verify)
	.it('should shift result').assertDoesNotThrow(c.result.shift.verify)
	.it('should create rows for manyLegs').assertDoesNotThrow(c.nextResultToRows.verify)	
;
	

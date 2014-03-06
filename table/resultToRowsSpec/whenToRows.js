var when = require('a').when;
var c = {};

when(c)
	.it('should return rows').assertEqual(c.rows,c.returned)
	.it('should shift result').assertDoesNotThrow(c.result.shift.verify)
	.it('should create rows for manyLegs').assertDoesNotThrow(c.nextResultToRows.verify)	
;
	

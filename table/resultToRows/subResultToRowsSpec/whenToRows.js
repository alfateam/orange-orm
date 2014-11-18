var when = require('a').when;
var c = {};

when(c)
	.it('should create rows for manyLegs').assertDoesNotThrow(c.resultToRows.verify)
	.it('should create rows for join and oneLeg').assertDoesNotThrow(c.subResultToRows.verify)
var when = require('a').when;
var c = {};

when(c)
	.it('should return rows').assertEqual(c.rows,c.returned)
	.it('should create subrows').assertDoesNotThrow(c.subResultToRows.verify)	
	

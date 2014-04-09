var when = require('a').when;
var c = {};

when(c)
	.it('should push insertCommand').assertDoesNotThrow(c.pushCommand.verify)
	.it('should return row').assertEqual(c.row, c.returned)	
	;

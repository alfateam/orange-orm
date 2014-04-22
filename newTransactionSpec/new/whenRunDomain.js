var when = require('a').when;
var c = {};

when(c)
	.it('should begin transaction').assertDoesNotThrow(c.begin.verify)
	.it('should connect').assertDoesNotThrow(c.pg.connect.verify)
	
	;

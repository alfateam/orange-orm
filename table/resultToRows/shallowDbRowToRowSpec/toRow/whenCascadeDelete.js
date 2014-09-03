var when = require('a').when;
var c = {};

when(c)
	.it('should delete row').assertDoesNotThrow(c.delete.verify)
	
var when = require('a').when;
var c = {};

when(c)
	.it('should connect').assertDoesNotThrow(c.pool.connect.verify)
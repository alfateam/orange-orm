var when = require('a').when;
var c = {};

when(c)
	.it('should start drain').assertDoesNotThrow(c.pgPool.drain.verify)

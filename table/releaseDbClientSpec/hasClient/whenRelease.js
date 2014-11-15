var when = require('a').when;
var c = {};

when(c)
	.it('should release client').assertDoesNotThrow(c.dbClientDone.verify)
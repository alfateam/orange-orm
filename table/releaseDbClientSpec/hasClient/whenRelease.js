var when = require('a').when;
var c = {};

when(c)
	.it('should release client').assertDoesNotThrow(c.dbClientDone.verify)
	.it('should delete session context').assertDoesNotThrow(c.deleteSessionContext.verify)
var when = require('a').when;
var c = {};

when(c)
	.it('should start ending').assertDoesNotThrow(c.mysqlPool.end.verify)

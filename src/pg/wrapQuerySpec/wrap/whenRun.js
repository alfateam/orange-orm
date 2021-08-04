var when = require('a').when;
var c = {};

when(c)
	.it('should log query').assertDoesNotThrow(c.log.verify)
	.it('should execute query').assertDoesNotThrow(c.runQuery.verify)

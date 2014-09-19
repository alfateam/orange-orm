var when = require('a').when;
var c = {};

when(c)
	.it('should execute query').assertDoesNotThrow(c.runQuery.verify)

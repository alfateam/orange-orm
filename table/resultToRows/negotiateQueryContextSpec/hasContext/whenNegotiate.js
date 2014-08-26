var when = require('a').when;
var c = {};

when(c)
	.it('should add row to context').assertDoesNotThrow(c.queryContext.add.verify)

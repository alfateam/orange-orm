var when = require('a').when;
var c = {};

when(c)
	.it('should expand inverse relation').assertDoesNotThrow(c.queryContext.expand.verify)
	

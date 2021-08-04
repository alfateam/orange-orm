var when = require('a').when;
var c = {};

when(c)
	.it('should expand rows').assertDoesNotThrow(c.relation.expand.verify)
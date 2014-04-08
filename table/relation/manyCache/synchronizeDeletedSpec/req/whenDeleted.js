var when = require('a').when;
var c = {};

when(c)
	.it('should remove from manyCache').assertDoesNotThrow(c.tryRemove.verify)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should add to manyCache').assertDoesNotThrow(c.tryAdd.verify)
	;

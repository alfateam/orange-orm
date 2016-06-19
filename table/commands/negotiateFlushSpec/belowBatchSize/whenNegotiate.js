var when = require('a').when;
var c = {};

when(c)
	.it('should not flush').assertDoesNotThrow(c.flush.verify);
	
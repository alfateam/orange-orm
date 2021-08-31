var when = require('a').when;
var c = {};

when(c)
	.it('should not invoke callback').assertDoesNotThrow(c.callback.verify)
	.it('should not invoke callback2').assertDoesNotThrow(c.callback2.verify);
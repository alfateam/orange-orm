var when = require('a').when;
var c = {};

when(c)
	.it('should run callback').assertDoesNotThrow(c.callback.verify);
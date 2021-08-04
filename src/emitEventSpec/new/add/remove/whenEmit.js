var when = require('a').when;
var c = {};

when(c)
	.it('should invoke callback2').assertDoesNotThrow(c.callback2.verify);
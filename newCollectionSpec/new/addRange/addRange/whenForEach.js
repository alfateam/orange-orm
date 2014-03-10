var when = require('a').when;
var c = {};

when(c)
	.it('enumerates').assertDoesNotThrow(c.callback.verify)
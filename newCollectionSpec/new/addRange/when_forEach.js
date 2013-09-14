var when = require('a').when;
var c = {};

when('./forEach',c)
	.it('enumerates').assertDoesNotThrow(c.callback.verify);
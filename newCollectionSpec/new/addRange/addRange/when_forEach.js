var when = require('a_test').when;
var c = {};

when('./forEach',c)
	.it('enumerates').assertDoesNotThrow(c.callback.verify)
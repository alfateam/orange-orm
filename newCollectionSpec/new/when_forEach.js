var when = require('a_test').when;
var c = {};

when('./forEach',c)
	.it('should not run callback').assertDoesNotThrow(c.callback.verify);
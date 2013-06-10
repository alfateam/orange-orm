var when = require('a_test').when;
var c = {};

when('./forEach',c)
	.it('should run callback').assertDoesNotThrow(c.callback.verify);
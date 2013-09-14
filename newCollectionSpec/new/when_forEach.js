var when = require('a').when;
var c = {};

when('./forEach',c)
	.it('should run callback').assertDoesNotThrow(c.callback.verify);
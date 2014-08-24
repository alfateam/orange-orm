var when = require('a').when;
var c = {};

when(c)
	.it('should set session singleton').assertDoesNotThrow(c.setSessionSingleton.verify)

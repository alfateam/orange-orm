var when = require('a').when;
var c = {};

when('./execute',c)
	.it('should return empty strategy').assertDoesNotThrow(c.returned);
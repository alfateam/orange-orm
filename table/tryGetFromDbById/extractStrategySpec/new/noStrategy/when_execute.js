var when = require('a_test').when;
var c = {};

when('./execute',c)
	.it('should return empty strategy').assertDoesNotThrow(c.returned);
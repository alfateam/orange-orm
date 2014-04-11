var when = require('a').when;
var c = {};

when(c)
	.it('should return true').assertOk(c.returned)
	;

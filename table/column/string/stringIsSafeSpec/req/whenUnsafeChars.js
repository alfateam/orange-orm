var when = require('a').when;
var c = {};

when(c)
	.it('should return false').assertOk(!c.returned);
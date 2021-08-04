var when = require('a').when;
var c = {};

when(c)
	.it('should return true').assertStrictEqual(true,c.returned);
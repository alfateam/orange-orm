var when = require('a').when;
var c = {};

when(c)
	.it('should return false').assertStrictEqual(false,c.returned);
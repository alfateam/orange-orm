var when = require('a').when;
var c = {};

when(c)
	.it('should return arg unchanged').assertStrictEqual(c.arg,c.returned);
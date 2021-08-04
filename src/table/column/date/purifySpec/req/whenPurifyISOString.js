var when = require('a').when;
var c = {};

when(c)
	.it('should return iso string').assertStrictEqual(c.iso, c.returned);
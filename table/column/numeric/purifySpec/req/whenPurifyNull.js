var when = require('a').when;
var c = {};

when(c)
	.it('should return null').assertStrictEqual(null,c.returned);
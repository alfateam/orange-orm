var when = require('a').when;
var c = {};

when(c)
	.it('should return cloned date').assertStrictEqual(c.expected, c.returned);
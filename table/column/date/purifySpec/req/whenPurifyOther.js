var when = require('a').when;
var c = {};

when(c)
	.it('should return parsed as date').assertStrictEqual(c.expected, c.returned);
var when = require('a').when;
var c = {};

when(c).
	it('shold return parsed value').assertStrictEqual(c.expected, c.returned);
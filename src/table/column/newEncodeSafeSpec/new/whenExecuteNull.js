var when = require('a').when;
var c = {};

when(c).
	it('shold return quoted dbNull').assertStrictEqual(c.expected,c.returned);
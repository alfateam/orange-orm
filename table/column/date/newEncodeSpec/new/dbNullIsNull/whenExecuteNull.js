var when = require('a').when;
var c = {};

when('./executeNull',c).
	it('shold return quoted dbNull').assertStrictEqual(c.expected,c.returned);
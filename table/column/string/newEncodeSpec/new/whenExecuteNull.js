var when = require('a_test').when;
var c = {};

when('./executeNull',c).
	it('shold return quoted dbNull').assertStrictEqual(c.expected,c.returned);
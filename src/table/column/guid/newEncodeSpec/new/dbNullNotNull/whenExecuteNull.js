var when = require('a').when;
var c = {};

when('./executeNull',c).
	it('should return quoted dbNull').assertStrictEqual(c.expected,c.returned);
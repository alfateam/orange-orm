var when = require('a').when;
var c = {};

when('./executeNull',c).
	it('should return unquoted dbNull').assertStrictEqual(c.expected,c.returned);
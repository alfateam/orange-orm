var when = require('a_test').when;
var c = {};

when('./encodeNull',c).
	it('should return quoted dbNull').assertStrictEqual(c.expected,c.returned);
var when = require('a_test').when;
var c = {};

when('./decodeDbNull',c).
	it('should return null ').assertStrictEqual(null,c.returned);
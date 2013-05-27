var when = require('a_test').when;
var c = {};

when('./executeDbNull',c).
	it('shold return null').assertStrictEqual(null,c.returned);
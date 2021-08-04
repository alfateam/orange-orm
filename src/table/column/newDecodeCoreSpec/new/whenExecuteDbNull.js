var when = require('a').when;
var c = {};

when('./executeDbNull',c).
	it('shold return null').assertStrictEqual(null,c.returned);
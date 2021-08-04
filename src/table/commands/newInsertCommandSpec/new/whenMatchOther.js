var when = require('a').when;
var c = {};

when(c)
	.it('returns false').assertStrictEqual(false, c.returned)
	;
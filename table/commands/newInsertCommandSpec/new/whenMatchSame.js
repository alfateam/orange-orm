var when = require('a').when;
var c = {};

when(c)
	.it('returns true').assertStrictEqual(true, c.returned)
	;
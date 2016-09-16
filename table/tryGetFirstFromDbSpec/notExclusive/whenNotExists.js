var when = require('a').when;
var c  = {};

when(c)
	.it('returns null').assertDeepEqual(null,c.returned);
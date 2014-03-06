var when = require('a').when;
var c = {};

when('./executeUndefined',c)
	.it('shold act as null').assertEqual(c.expected,c.returned);
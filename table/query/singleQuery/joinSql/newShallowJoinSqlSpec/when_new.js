var when = require('a').when;
var c = {};

when('./new',c)
	.it('returns expected').assertEqual(c.expected,c.returned);
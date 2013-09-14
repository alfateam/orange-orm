var when = require('a').when;
var c = {};

when('./parameters',c)
	.it('returns expected').assertEqual(c.expected,c.returned);
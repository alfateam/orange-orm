var when = require('a').when;
var c = {};

when('./sql',c)
	.it('returns expected').assertEqual(c.expected,c.returned);
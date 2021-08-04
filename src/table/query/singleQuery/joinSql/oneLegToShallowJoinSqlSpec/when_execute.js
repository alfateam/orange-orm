var when = require('a').when;
var c = {};

when('./execute',c)
	.it('returns expected').assertEqual(c.expected,c.returned);
var when = require('a').when;
var c = {};

when('./get',c)
	.it('returns rows').assertEqual(c.expected,c.returned);
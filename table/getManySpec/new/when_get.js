var when = require('a_test').when;
var c = {};

when('./get',c)
	.it('returns rows').assertEqual(c.expected,c.returned);
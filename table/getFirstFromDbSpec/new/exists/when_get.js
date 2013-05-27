var when = require('a_test').when;
var c = {};

when('./get',c)
	.it('returns row').assertEqual(c.expected,c.returned);
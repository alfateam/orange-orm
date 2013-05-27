var when = require('a_test').when;
var c = {};

when('./parameters',c)
	.it('returns expected').assertEqual(c.expected,c.returned);
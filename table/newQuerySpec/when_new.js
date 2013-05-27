var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('returns mutated composite query').assertEqual(c.expected,c.returned);
var when = require('a').when;
var c = {};

when('./new',c).
	it('returns mutated composite query').assertEqual(c.expected,c.returned);
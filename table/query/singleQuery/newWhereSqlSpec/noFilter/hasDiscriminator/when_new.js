var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return discriminatorsql').assertEqual(c.expected,c.returned);
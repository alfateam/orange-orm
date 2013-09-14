var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return expected').assertEqual(c.expected,c.returned);
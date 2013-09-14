var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return expected where').assertEqual(c.expected,c.returned);
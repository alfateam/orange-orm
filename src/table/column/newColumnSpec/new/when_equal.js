var when = require('a').when;
var c = {};

when('./equal',c)
	.it('should return equalFilter').assertEqual(c.expected,c.returned);
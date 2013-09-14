var when = require('a').when;
var c = {};

when('./null',c)
	.it('should return null').assertEqual(c.expected,c.returned);
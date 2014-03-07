var when = require('a').when;
var c = {};

when('./purifyFloat',c)
	.it('should return unchanged').assertEqual(c.expected,c.returned);
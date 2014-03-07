var when = require('a').when;
var c = {};

when('./purify',c)
	.it('should return arg unchanged').assertEqual(c.arg,c.returned);
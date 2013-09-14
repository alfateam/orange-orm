var when = require('a').when;
var c = {};

when('./purifyFloat',c)
	.it('should return floor').assertEqual(c.expected,c.returned);
var when = require('a').when;
var c = {};

when('./exec',c)
	.it('should return number unchanged').assertEqual(c.expected,c.returned);
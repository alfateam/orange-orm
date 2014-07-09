var when = require('a').when;
var c = {};

when('./execute',c)
	.it('should return expected').assertEqual(c.expected,c.returned);
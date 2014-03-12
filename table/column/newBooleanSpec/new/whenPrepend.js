var when = require('a').when;
var c = {};

when(c)
	.it('should return next prepended').assertEqual(c.expected,c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return from domainCache').assertEqual(c.expected, c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should throw with message').assertEqual(c.expected,c.thrownMsg);
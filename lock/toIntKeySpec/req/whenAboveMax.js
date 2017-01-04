var when = require('a').when;
var c = {};

when(c)
	.it('should return lock object').assertEqual(c.expected, c.returned);
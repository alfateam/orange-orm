var when = require('a').when;
var c = {};

when(c)
	.it('should return encoded dbNull').assertEqual(c.expected,c.returned);
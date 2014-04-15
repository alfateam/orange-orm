var when = require('a').when;
var c = {};

when(c)
	.it('should return arg unchanged').assertEqual(c.arg,c.returned);
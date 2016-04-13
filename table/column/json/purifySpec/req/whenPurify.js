var when = require('a').when;
var c = {};

when(c)
	.it('should return arg stringified').assertEqual(c.expected,c.returned);
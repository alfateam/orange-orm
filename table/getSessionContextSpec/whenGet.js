var when = require('a').when;
var c = {};

when(c)
	.it('should return context').assertEqual(c.expected, c.returned)

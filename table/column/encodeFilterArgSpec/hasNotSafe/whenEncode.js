var when = require('a').when;
var c = {};

when(c)
	.it('should return encoded').assertEqual(c.expected, c.returned)

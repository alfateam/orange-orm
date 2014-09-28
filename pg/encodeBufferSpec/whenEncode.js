var when = require('a').when;
var c = {};

when(c)
	.it('should return encoded buffer').assertEqual(c.expected, c.returned);
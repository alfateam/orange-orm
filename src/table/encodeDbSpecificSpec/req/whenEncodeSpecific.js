var when = require('a').when;
var c = {};

when(c)
	.it('should return encoded value for db').assertEqual(c.expected, c.returned)

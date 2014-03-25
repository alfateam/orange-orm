var when = require('a').when;
var c = {};

when(c)
	.it('should return related row').assertEqual(c.expected, c.returned)
	;

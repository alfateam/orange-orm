var when = require('a').when;
var c = {};

when(c)
	.it('should return first element from manyCache').assertEqual(c.expected, c.returned)
	;

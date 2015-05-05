var when = require('a').when;
var c = {};

when(c)
	.it('should map to dto').assertEqual(c.expected, c.returned)
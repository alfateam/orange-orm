var when = require('a').when;
var c = {};

when(c)
	.it('should return result from original func').assertEqual(c.expected, c.returned)
	;

var when = require('a').when;
var c = {};

when(c)
	.it('should return stringified promise').assertEqual(c.expected, c.returned)
	;

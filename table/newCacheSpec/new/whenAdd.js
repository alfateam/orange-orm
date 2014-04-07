var when = require('a').when;
var c = {};

when(c)
	.it('should return value').assertEqual(c.result, c.returned)
	;

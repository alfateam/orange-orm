var when = require('a').when;
var c = {};

when(c)
	.it('should return cached result').assertEqual(c.result, c.returned)
	;

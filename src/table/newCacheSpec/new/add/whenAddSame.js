var when = require('a').when;
var c = {};

when(c)
	.it('should return previous value').assertEqual(c.result, c.returned)
	;

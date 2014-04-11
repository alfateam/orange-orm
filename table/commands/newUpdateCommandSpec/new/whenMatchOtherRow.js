var when = require('a').when;
var c = {};

when(c)
	.it('should return false').assertEqual(false, c.returned)
	;

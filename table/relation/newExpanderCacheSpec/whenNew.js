var when = require('a').when;
var c = {};

when(c)
	.it('should return rowCache').assertEqual(c.rowCache, c.returned)
	;

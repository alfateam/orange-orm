var when = require('a').when;
var c = {};

when(c)
	.it('should return row').assertEqual(c.row, c.returned)
	;

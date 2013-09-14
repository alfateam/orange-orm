var when = require('a').when;
var c  = {};

when("./get",c)
	.it('returns row').assertEqual(c.row,c.returned);
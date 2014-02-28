var when = require('a').when;
var c  = {};

when("./get",c)
	.it('returns first row').assertEqual(c.row1,c.returned);
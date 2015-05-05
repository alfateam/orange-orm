var when = require('a').when;
var c = {};

when(c)
	.it('should return orderBy').assertEqual(c.orderBy, c.returned)
	
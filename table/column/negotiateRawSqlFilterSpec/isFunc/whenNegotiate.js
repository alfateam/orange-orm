var when = require('a').when;
var c = {};

when(c)
	.it('should return filter').assertEqual(c.filter, c.returned)

var when = require('a').when;
var c = {};

when(c)
	.it('should return current filter').assertEqual(c.filter, c.returned)

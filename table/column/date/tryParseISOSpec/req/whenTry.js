var when = require('a').when;
var c = {};

when(c)
	.it('should return iso unchanged').assertEqual(c.iso, c.returned)
	.it('should return iso2 unchanged').assertEqual(c.iso2, c.returned2)

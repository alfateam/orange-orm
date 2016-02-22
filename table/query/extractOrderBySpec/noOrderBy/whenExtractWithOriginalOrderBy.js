var when = require('a').when;
var c = {};

when(c)
	.it('should return original orderBy').assertEqual(c.originalOrderBy, c.returned)
	
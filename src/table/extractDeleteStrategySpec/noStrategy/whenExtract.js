var when = require('a').when;
var c = {};

when(c)
	.it('should return empty strategy').assertEqual(c.emptyStrategy, c.returned)

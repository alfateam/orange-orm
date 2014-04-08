var when = require('a').when;
var c = {};

when(c)
	.it('should return cache').assertEqual(c.cache, c.returned)
	;

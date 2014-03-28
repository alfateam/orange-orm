var when = require('a').when;
var c = {};

when(c)
	.it('should return id unchanged').assertEqual(c.id, c.returned)
	;

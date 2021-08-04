var when = require('a').when;
var c = {};

when(c)
	.it('should return value unchanged').assertEqual(c.value, c.returned)

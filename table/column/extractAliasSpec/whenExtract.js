var when = require('a').when;
var c = {};

when(c)
	.it('should return alias').assertEqual(c.alias,c.returned);
var when = require('a').when;
var c = {};

when(c)
	.it('should add sub queries').assertEqual(c.query, c.returned)
	

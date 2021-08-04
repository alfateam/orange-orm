var when = require('a').when;
var c = {};

when(c)
	.it('should return falsy').assertEqual(undefined, c.returned);

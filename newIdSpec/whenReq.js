var when = require('a').when;
var c = {};

when(c)
	.it('should return node-uuid.v4').assertEqual(c.v4, c.returned);
	;

var when = require('a').when;
var c = {};

when(c)
	.it('returns false').assertEqual(false, c.returned);
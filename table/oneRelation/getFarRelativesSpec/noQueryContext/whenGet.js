var when = require('a').when;
var c = {};

when(c)
	.it('returns empty promise').assertEqual(c.empty, c.returned);
var when = require('a').when;
var c = {};

when(c)
	.it('returns expected').assertEqual(c.expected, c.returned);

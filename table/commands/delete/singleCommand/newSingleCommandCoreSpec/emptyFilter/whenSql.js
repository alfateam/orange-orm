var when = require('a').when;
var c = {};

when(c)
	.it('returns correct sql').assertEqual(c.expected, c.returned)
var when = require('a').when;
var c = {};

when(c)
	.it('returns result from queryContext').assertEqual(c.expected, c.returned)

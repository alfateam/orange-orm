var when = require('a').when;
var c = {};

when(c)
	.it('returns nullPromise').assertEqual(c.expected, c.returned);
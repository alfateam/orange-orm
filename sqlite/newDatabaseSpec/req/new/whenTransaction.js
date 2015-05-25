var when = require('a').when;
var c = {};

when(c)
	.it('should return new transaction').assertEqual(c.expected, c.returned)
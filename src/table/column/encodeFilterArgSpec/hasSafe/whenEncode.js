var when = require('a').when;
var c = {};

when(c)
	.it('should return safely encoded').assertEqual(c.expected, c.returned)

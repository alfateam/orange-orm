var when = require('a').when;
var c = {};

when(c)
	.it('should return strategy').assertEqual(c.strategy, c.returned)

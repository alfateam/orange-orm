var when = require('a').when;
var c = {};

when(c)
	.it('returns strategy').assertEqual(c.strategy, c.returned)
	;

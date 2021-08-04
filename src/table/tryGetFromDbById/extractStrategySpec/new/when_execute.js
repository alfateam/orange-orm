var when = require('a').when;
var c = {};

when('./execute',c)
	.it('should return strategy').assertEqual(c.strategy,c.returned);
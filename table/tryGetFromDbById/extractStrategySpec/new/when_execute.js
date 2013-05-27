var when = require('a_test').when;
var c = {};

when('./execute',c)
	.it('should return strategy').assertEqual(c.strategy,c.returned);
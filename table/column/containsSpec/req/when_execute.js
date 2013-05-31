var when = require('a_test').when;
var c = {}

when('./execute',c)
	.it('should return filter').assertEqual(c.expected,c.returned);
var when = require('a_test').when;
var c = {}

when('./equal',c)
	.it('should return filter').assertEqual(c.expected,c.returned);
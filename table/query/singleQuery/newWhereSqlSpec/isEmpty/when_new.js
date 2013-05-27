var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should return expected where').assertEqual(c.expected,c.returned);
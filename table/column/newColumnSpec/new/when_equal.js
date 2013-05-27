var when = require('a_test').when;
var c = {};

when('./equal',c)
	.it('should return equalFilter').assertEqual(c.expected,c.returned);
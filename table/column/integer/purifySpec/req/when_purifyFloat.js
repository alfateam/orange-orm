var when = require('a_test').when;
var c = {};

when('./purifyFloat',c)
	.it('should return floor').assertEqual(c.expected,c.returned);
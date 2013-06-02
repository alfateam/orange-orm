var when = require('a_test').when;
var c = {};

when('./null',c)
	.it('should return encoded dbNull').assertEqual(c.expected,c.returned);
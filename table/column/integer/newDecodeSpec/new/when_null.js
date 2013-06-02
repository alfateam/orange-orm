var when = require('a_test').when;
var c = {};

when('./null',c)
	.it('should return null').assertEqual(c.expected,c.returned);
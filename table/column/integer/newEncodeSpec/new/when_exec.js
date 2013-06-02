var when = require('a_test').when;
var c = {};

when('./exec',c)
	.it('should return number as string').assertEqual(c.expected,c.returned);
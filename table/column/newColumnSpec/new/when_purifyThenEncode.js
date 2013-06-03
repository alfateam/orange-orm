var when = require('a_test').when;
var c = {};

when('./purifyThenEncode',c)
	.it('should return encoded').assertEqual(c.expected,c.returned);
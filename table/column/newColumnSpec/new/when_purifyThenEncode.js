var when = require('a').when;
var c = {};

when('./purifyThenEncode',c)
	.it('should return encoded').assertEqual(c.expected,c.returned);
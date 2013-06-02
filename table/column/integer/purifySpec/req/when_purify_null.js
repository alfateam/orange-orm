var when = require('a_test').when;
var c = {};

when('./purify_null',c)
	.it('should return null').assertEqual(null,c.returned);
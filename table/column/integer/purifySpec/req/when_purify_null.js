var when = require('a').when;
var c = {};

when('./purify_null',c)
	.it('should return null').assertEqual(null,c.returned);
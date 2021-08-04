var when = require('a').when;
var c = {};

when('./executeUndefined',c)
	.it('should return unquoted dbNull').assertEqual(c.expected,c.returned);
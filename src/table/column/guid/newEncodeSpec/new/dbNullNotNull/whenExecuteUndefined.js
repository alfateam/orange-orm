var when = require('a').when;
var c = {};

when('./executeUndefined',c)
	.it('should return quoted dbNull').assertEqual(c.expected,c.returned);
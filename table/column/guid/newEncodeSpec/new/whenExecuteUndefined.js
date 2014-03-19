var when = require('a').when;
var c = {};

when('./executeUndefined',c)
	.it('shold return quoted dbNull').assertEqual(c.expected,c.returned);
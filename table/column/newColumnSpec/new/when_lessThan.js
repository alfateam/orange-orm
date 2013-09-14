var when = require('a').when;
var c = {};

when('./lessThan',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
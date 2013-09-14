var when = require('a').when;
var c = {};

when('./lessThanOrEqual',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
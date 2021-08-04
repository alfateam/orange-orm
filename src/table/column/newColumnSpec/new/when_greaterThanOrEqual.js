var when = require('a').when;
var c = {};

when('./greaterThanOrEqual',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
var when = require('a').when;
var c = {};

when('./greaterThan',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
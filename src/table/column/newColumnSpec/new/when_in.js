var when = require('a').when;
var c = {};

when('./in',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
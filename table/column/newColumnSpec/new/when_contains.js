var when = require('a').when;
var c = {};

when('./contains',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
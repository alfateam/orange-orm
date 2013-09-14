var when = require('a').when;
var c = {};

when('./between',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
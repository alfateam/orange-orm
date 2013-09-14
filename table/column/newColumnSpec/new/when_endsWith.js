var when = require('a').when;
var c = {};

when('./endsWith',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
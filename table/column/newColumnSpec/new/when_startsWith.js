var when = require('a_test').when;
var c = {};

when('./startsWith',c)
	.it('should return filter').assertEqual
	(c.expected,c.returned);
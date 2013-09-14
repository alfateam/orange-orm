var when = require('a').when;
var c = {}

when('./startsWith',c)
	.it('should return filter').assertEqual(c.expected,c.returned);
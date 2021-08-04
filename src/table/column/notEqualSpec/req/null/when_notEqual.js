var when = require('a').when;
var c = {}

when('./notEqual',c)
	.it('should return filter').assertEqual(c.expected,c.returned);
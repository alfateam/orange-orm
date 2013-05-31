var when = require('a_test').when;
var c = {};

when('./notEqual',c)
	.it('should return filter').assertEqual(c.expected,c.returned);
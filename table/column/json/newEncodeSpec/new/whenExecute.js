var when = require('a').when;
var c = {};

when('./execute',c)
	.it('should return parameterized value').assertEqual(c.expected,c.returned);
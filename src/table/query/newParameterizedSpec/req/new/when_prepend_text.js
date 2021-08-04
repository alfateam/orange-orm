var when = require('a').when;
var c = {};

when('prepend_text', c)
	.it('should return prepended parameterized').assertDeepEqual(c.expected, c.returned);
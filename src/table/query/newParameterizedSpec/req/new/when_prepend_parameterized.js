var when = require('a').when;
var c = {};

when('prepend_parameterized', c)
	.it('should return prepended parameterized').assertDeepEqual(c.expected, c.returned);
var when = require('a_test').when;
var c = {};

when('append_text', c)
	.it('should return prepended parameterized').assertDeepEqual(c.expected, c.returned);
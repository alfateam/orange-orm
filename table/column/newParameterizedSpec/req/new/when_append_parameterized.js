var when = require('a_test').when;
var c = {};

when('append_parameterized', c)
	.it('should return appended parameterized').assertDeepEqual(c.expected, c.returned);
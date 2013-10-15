var when = require('a').when;
var c = {};

when('append_parameterized', c)
	.it('should return appended parameterized').assertDeepEqual(c.expected, c.returned);
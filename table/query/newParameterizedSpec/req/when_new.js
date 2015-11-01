var when = require('a').when;
var c = {};

when('./new', c)
	.it('should return sql').assertEqual(c.text, c.returned.sql())
	.it('should set parameters').assertStrictEqual(c.params, c.returned.parameters);
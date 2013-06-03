var when = require('a_test').when;
var c = {};

when('./new', c)
	.it('should return sql').assertEqual(c.text, c.returned.sql())
	.it('should return parameters').assertDeepEqual(c.collection, c.returned.parameters);
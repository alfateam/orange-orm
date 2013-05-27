var when = require('a_test').when;
var c = {};

when('./sql',c)
	.it('returns sql').assertEqual(c.sql,c.returned);

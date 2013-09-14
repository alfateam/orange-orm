var when = require('a').when;
var c = {};

when('./sql',c)
	.it('returns sql').assertEqual(c.sql,c.returned);

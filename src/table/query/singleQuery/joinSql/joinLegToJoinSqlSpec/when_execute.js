var when = require('a').when;
var c = {};

when('./execute',c)
	.it('returns shallowJoinSql concat nextJoinSql').assertEqual(c.expected,c.returned);
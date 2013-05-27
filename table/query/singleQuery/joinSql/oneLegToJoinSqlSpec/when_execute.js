var when = require('a_test').when;
var c = {};

when('./execute',c)
	.it('returns shallowJoinSql concat nextJoinSql').assertEqual(c.expected,c.returned);
var when = require('a_test').when;
var c = {};

when('./execute',c)
	.it('returns shallowJoinSql concat joinedColumnSql').assertEqual(c.expected,c.returned);
var when = require('a').when;
var c = {};

when('./execute',c)
	.it('returns shallowJoinSql concat joinedColumnSql').assertEqual(c.expected,c.returned);
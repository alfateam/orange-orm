var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('returns joinLegSql concat oneLegSql').assertEqual(c.expected,c.returned);
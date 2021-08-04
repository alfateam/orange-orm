var when = require('a').when;
var c = {};

when('./new',c)
	.it('returns joinLegSql concat oneLegSql').assertEqual(c.expected,c.returned);
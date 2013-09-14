var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return shallowColumnSql concat joinedColumnSql').assertEqual(c.expected,c.returned);
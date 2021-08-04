var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return filter').assertDeepEqual(c.filter,c.returned);
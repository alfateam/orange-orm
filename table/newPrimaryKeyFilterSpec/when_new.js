var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should return filter').assertDeepEqual(c.filter,c.returned);
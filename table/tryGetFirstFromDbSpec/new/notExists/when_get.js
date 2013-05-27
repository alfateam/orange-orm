var when = require('a_test').when;
var c  = {};

when("./get",c)
	.it('returns null').assertDeepEqual(null,c.returned);
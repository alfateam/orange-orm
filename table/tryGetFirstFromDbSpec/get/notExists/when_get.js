var when = require('a').when;
var c  = {};

when("./get",c)
	.it('returns null').assertDeepEqual(null,c.returned);
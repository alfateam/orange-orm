var when = require('a').when;
var c = {};

when(c)
	.it('should map values').assertDeepEqual(c.expected, c.returned)
	.it('should return dto').assertStrictEqual(c.dto, c.returned)
	;

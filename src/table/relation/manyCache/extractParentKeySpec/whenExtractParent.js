var when = require('a').when;
var c = {};

when(c)
	.it('should return key').assertDeepEqual(c.expected, c.returned)
	;

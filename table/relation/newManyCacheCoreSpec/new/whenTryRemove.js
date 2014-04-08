var when = require('a').when;
var c = {};

when(c)
	.it('should remove row').assertDeepEqual(c.expected, c.existing)
	;

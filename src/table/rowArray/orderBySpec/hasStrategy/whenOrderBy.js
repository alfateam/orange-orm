var when = require('a').when;
var c = {};

when(c)
	.it('should sort').assertDeepEqual(c.expected, c.returned)

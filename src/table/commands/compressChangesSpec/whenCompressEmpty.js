var when = require('a').when;
var c = {};

when(c)
	.it('should return compressed').assertDeepEqual(c.expected, c.returned)
;
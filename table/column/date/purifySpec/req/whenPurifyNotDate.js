var when = require('a').when;
var c = {};

when(c)
	.it('should return parse date').assertDeepEqual(c.expected,c.returned);
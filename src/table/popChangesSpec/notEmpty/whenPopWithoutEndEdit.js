var when = require('a').when;
var c = {};

when(c)
	.it('should return compressed changeSet').assertEqual(c.expected, c.returned)
	.it('should clear changeSet').assertDeepEqual(0, c.changeSet.length)
	;

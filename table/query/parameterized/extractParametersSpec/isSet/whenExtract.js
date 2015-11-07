var when = require('a').when;
var c = {};

when(c)
	.it('should return equivalent argument').assertDeepEqual(c.parameters, c.returned)
	.it('should not return same argument').assertNotEqual(c.parameters, c.returned)


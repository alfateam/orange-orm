var when = require('a').when;
var c = {};

when(c)
	.it('should not throw').assertEqual(false, c.didThrow)
	.it('should return candidate').assertEqual(c.candidate, c.returned);
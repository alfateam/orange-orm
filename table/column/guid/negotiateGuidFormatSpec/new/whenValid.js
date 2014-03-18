var when = require('a').when;
var c = {};

when(c)
	.it('should not throw').assertEqual(false, c.didThrow);
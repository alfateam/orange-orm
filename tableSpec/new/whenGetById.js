var c = {};
var when = require('a').when;

when(c)
	.it('should return expected').assertEqual(c.expected,c.returned)
	.it('should return expected exclusive').assertEqual(c.expectedExclusive,c.returnedExclusive)

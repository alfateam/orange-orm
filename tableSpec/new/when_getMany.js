var c = {};
var when = require('a').when;

when('./getMany', c)
	.it('should return expectedExclusive').assertEqual(c.expectedExclusive,c.returnedExclusive)
	.it('should return expected').assertEqual(c.expected,c.returned)

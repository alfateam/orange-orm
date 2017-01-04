var when = require('a').when;
var c = {};

when(c)
	.it('should return undefined for zero').assertEqual(undefined, c.returned1)
	.it('should return undefined for 999').assertEqual(undefined, c.returned2)
	.it('should return empty promise for 1000').assertEqual(c.expected3, c.returned3)
	.it('should return undefined for 1500').assertEqual(undefined, c.returned4)
	.it('should return empty promise for 2000').assertEqual(c.expected5, c.returned5)

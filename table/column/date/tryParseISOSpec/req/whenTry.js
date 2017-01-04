var when = require('a').when;
var c = {};

when(c)
	.it('should return isoWithJsTimezone unchanged').assertEqual(c.isoWithJsTimezone, c.returned)
	.it('should return isoWithPgTimezone unchanged').assertEqual(c.isoWithPgTimezone, c.returned2)
	.it('should return isoWithoutTimezone unchanged').assertEqual(c.isoWithoutTimezone, c.returned3)

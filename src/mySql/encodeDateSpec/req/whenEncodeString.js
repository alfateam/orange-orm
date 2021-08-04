var when = require('a').when;
var c = {};

when(c)
	.it('should return ISO without time zone for plus zone').assertEqual(c.expected, c.returned)
	.it('should return ISO without time zone for minus zone').assertEqual(c.expected2, c.returned2)
	.it('should return ISO without time zone for zulu zone').assertEqual(c.expected3, c.returned3)

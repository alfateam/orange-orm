var when = require('a').when;
var c = {};

when(c)
	.it('should return result').assertEqual(c.expected, c.returned)
	.it('should set current flush on changeSet').assertEqual(c.returned, c.context.flushing)
	
		

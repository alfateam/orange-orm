var when = require('a').when;
var c = {};

when(c)
	.it('should raise done').assertDoesNotThrow(c.done.verify)	
	.it('should remove pool from pools').assertEqual(false, c.id in c.pools)
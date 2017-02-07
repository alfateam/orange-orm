var when = require('a').when;
var c = {};

when(c)
	.it('should destroyAllNow').assertDoesNotThrow(c.pgPool.destroyAllNow.verify)
	.it('should raise endCompleted').assertDoesNotThrow(c.endCompleted.verify)	
	.it('should remove pool from pools').assertEqual(false, c.id in c.pools)
	

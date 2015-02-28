var when = require('a').when;
var c = {};

when(c)
	.it('should destroyAllNow').assertDoesNotThrow(c.pgPool.destroyAllNow.verify)
	.it('should raise endCompleted').assertDoesNotThrow(c.endCompleted.verify)	
	.it('should remove pgPool from pg.pools.all').assertDeepEqual({}, c.pg.pools.all)

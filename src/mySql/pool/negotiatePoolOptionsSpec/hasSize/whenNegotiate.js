var when = require('a').when;
var c = {};

when(c)
	.it('should set connectionLimit to size').assertEqual(c.pool.config.connectionLimit, c.poolOptions.size)
	.it('should set foo option').assertEqual(c.pool.config.foo, c.poolOptions.foo)
	.it('should set bar option').assertEqual(c.pool.config.bar, c.poolOptions.bar)
	
	
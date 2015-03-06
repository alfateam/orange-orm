var when = require('a').when;
var c = {};

when(c)
	.it('should not override connectionLimit').assertEqual(c.pool.config.connectionLimit, c.connectionLimit)
	.it('should set foo option').assertEqual(c.pool.config.foo, c.poolOptions.foo)
	.it('should set bar option').assertEqual(c.pool.config.bar, c.poolOptions.bar)
	
	
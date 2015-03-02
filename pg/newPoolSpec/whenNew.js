var when = require('a').when;
var c = {};

when(c)
	.it('should set end').assertEqual(c.denodeifiedEndPool, c.sut.end)
	.it('should set connect').assertEqual(c.pgPool.connect, c.sut.connect)
	.it('should add pool to pools').assertDeepEqual(c.pools[c.id], c.sut)

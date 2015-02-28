var when = require('a').when;
var c = {};

when(c)
	.it('should set end').assertEqual(c.denodeifiedEndPool, c.sut.end)
	.it('should add pool to pools singleton').assertDeepEqual([c.sut], c.pools)

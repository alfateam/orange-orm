var when = require('a').when;
var c = {};

when(c)
	.it('getAll points to domainCache.getAll ').assertEqual(c.domainCache.getAll, c.sut.getAll)
	;

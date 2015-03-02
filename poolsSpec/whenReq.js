var when = require('a').when;
var c = {};

when(c)
	.it('should return emtpy object singleton').assertEqual(c.pools, c.sut)

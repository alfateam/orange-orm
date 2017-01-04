var when = require('a').when;
var c = {};

when(c)
	.it('should set exclusive').assertEqual(c.tryGetFromDbById.exclusive, c.sut.exclusive)

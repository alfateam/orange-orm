var when = require('a').when;
var c = {};

when(c)
	.it('should synchronize added').assertEqual(c.sut.tryAdd, c.synchronizedAction)
	;
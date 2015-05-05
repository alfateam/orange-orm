var when = require('a').when;
var c = {};

when(c)
	.it('should set length').assertEqual(2, c.sut.length)
	
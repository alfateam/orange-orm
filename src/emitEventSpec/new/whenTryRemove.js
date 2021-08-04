var when = require('a').when;
var c = {};

when(c)
	.it('forward to remove').assertDoesNotThrow(c.sut.remove.verify);